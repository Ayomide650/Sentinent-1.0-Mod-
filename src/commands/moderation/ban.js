const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { supabase } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user with optional reason and duration')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addStringOption(opt => opt.setName('time').setDescription('Ban duration (e.g. 1d, 2h, 30m)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const timeString = interaction.options.getString('time');
      const moderator = interaction.user;
      const guildId = interaction.guild.id;

      // Check if user is trying to ban themselves
      if (targetUser.id === moderator.id) {
        return await interaction.reply({ 
          content: '❌ You cannot ban yourself!', 
          ephemeral: true 
        });
      }

      // Check if target is a bot
      if (targetUser.bot) {
        return await interaction.reply({ 
          content: '❌ You cannot ban bots!', 
          ephemeral: true 
        });
      }

      // Check if user is already banned
      try {
        const banList = await interaction.guild.bans.fetch();
        if (banList.has(targetUser.id)) {
          return await interaction.reply({ 
            content: '❌ User is already banned!', 
            ephemeral: true 
          });
        }
      } catch (error) {
        console.error('Error checking ban list:', error);
      }

      // Parse time duration
      let banDuration = null;
      let unbanDate = null;
      let isTemporary = false;

      if (timeString) {
        banDuration = parseTimeString(timeString);
        if (banDuration) {
          unbanDate = new Date(Date.now() + banDuration);
          isTemporary = true;
        } else {
          return await interaction.reply({ 
            content: '❌ Invalid time format! Use formats like: 1d, 2h, 30m, 1w', 
            ephemeral: true 
          });
        }
      }

      // Execute the ban
      try {
        await interaction.guild.members.ban(targetUser.id, { 
          reason: `${reason} | Banned by: ${moderator.tag}${isTemporary ? ` | Duration: ${timeString}` : ''}`,
          deleteMessageDays: 1 // Delete messages from last 1 day
        });
      } catch (banError) {
        console.error('Error banning user:', banError);
        return await interaction.reply({ 
          content: '❌ Failed to ban user. They might have higher permissions or already be banned.', 
          ephemeral: true 
        });
      }

      // Insert ban into database
      const { error: insertError } = await supabase
        .from('bans')
        .insert({
          user_id: targetUser.id,
          guild_id: guildId,
          moderator_id: moderator.id,
          reason: reason,
          is_temporary: isTemporary,
          unban_date: unbanDate?.toISOString() || null,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting ban:', insertError);
        // Don't return error here as ban was successful, just log it
      }

      // Create ban embed for public channel
      const banEmbed = new EmbedBuilder()
        .setColor('#DC143C')
        .setTitle('🔨 User Banned')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Banned by', value: `<@${moderator.id}>`, inline: true },
          { name: 'Duration', value: isTemporary ? timeString : 'Permanent', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `User ID: ${targetUser.id}` });

      if (isTemporary) {
        banEmbed.addFields({ 
          name: 'Unban Date', 
          value: `<t:${Math.floor(unbanDate.getTime() / 1000)}:F>`, 
          inline: false 
        });
      }

      // Schedule unban if temporary
      if (isTemporary && banDuration) {
        setTimeout(async () => {
          try {
            await interaction.guild.members.unban(targetUser.id, 'Temporary ban expired');
            
            // Update database
            await supabase
              .from('bans')
              .update({ unbanned_at: new Date().toISOString() })
              .eq('user_id', targetUser.id)
              .eq('guild_id', guildId)
              .is('unbanned_at', null);

            // Send unban log
            const banChannelId = process.env.BAN_LOG_CHANNEL;
            if (banChannelId) {
              const banChannel = interaction.guild.channels.cache.get(banChannelId);
              if (banChannel) {
                const unbanEmbed = new EmbedBuilder()
                  .setColor('#28A745')
                  .setTitle('🔓 User Unbanned (Automatic)')
                  .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Reason', value: 'Temporary ban expired', inline: true }
                  )
                  .setTimestamp();
                
                await banChannel.send({ embeds: [unbanEmbed] });
              }
            }
          } catch (unbanError) {
            console.error('Error auto-unbanning user:', unbanError);
          }
        }, banDuration);
      }

      // Reply to the command (ephemeral)
      const replyMessage = `✅ ${targetUser.tag} has been banned${isTemporary ? ` for ${timeString}` : ' permanently'}. Reason: ${reason}`;
      await interaction.reply({ 
        content: replyMessage, 
        ephemeral: true 
      });

      // Send public ban log to specific channel from env
      const banChannelId = process.env.BAN_LOG_CHANNEL;
      if (banChannelId) {
        const banChannel = interaction.guild.channels.cache.get(banChannelId);
        if (banChannel) {
          await banChannel.send({ embeds: [banEmbed] });
        } else {
          console.error('Ban log channel not found:', banChannelId);
        }
      } else {
        // Fallback to current channel if env var not set
        await interaction.followUp({ embeds: [banEmbed] });
      }

    } catch (error) {
      console.error('Error in ban command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while processing the ban.', 
        ephemeral: true 
      });
    }
  }
};

// Helper function to parse time strings
function parseTimeString(timeStr) {
  const timeRegex = /^(\d+)([smhdw])$/i;
  const match = timeStr.match(timeRegex);
  
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
    w: 7 * 24 * 60 * 60 * 1000 // weeks
  };
  
  return value * multipliers[unit];
}
