const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { supabase } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user and log the warning')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const moderator = interaction.user;
      const guildId = interaction.guild.id;

      // Check if user is trying to warn themselves
      if (targetUser.id === moderator.id) {
        return await interaction.reply({ 
          content: '❌ You cannot warn yourself!', 
          ephemeral: true 
        });
      }

      // Check if target is a bot
      if (targetUser.bot) {
        return await interaction.reply({ 
          content: '❌ You cannot warn bots!', 
          ephemeral: true 
        });
      }

      // Insert warning into database
      const { error: insertError } = await supabase
        .from('warnings')
        .insert({
          user_id: targetUser.id,
          guild_id: guildId,
          moderator_id: moderator.id,
          reason: reason,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting warning:', insertError);
        return await interaction.reply({ 
          content: '❌ Failed to save warning to database.', 
          ephemeral: true 
        });
      }

      // Get updated warning count for this user in this guild
      const { data: warnings, error: countError } = await supabase
        .from('warnings')
        .select('*')
        .eq('user_id', targetUser.id)
        .eq('guild_id', guildId);

      if (countError) {
        console.error('Error getting warning count:', countError);
        return await interaction.reply({ 
          content: '❌ Failed to retrieve warning count.', 
          ephemeral: true 
        });
      }

      const warningCount = warnings.length;

      // Create warning embed for public channel
      const warningEmbed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('⚠️ User Warned')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Warned by', value: `<@${moderator.id}>`, inline: true },
          { name: 'Warning Count', value: `${warningCount}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `User ID: ${targetUser.id}` });

      // Check for escalation (3+ warnings = ban)
      let escalationMessage = '';
      if (warningCount >= 3) {
        try {
          // Ban the user
          await interaction.guild.members.ban(targetUser.id, { 
            reason: `Auto-ban: ${warningCount} warnings reached. Latest: ${reason}` 
          });
          
          warningEmbed.setColor('#DC143C');
          warningEmbed.setTitle('🔨 User Warned & Banned');
          escalationMessage = '\n\n**User has been automatically banned for reaching 3+ warnings.**';
          
          // Log the ban in database (optional)
          await supabase
            .from('bans')
            .insert({
              user_id: targetUser.id,
              guild_id: guildId,
              moderator_id: 'AUTO-BAN',
              reason: `Auto-ban: ${warningCount} warnings`,
              created_at: new Date().toISOString()
            });
            
        } catch (banError) {
          console.error('Error banning user:', banError);
          escalationMessage = '\n\n**⚠️ User should be banned (3+ warnings) but ban failed. Please ban manually.**';
        }
      }



      // Reply to the command (ephemeral)
      await interaction.reply({ 
        content: `✅ ${targetUser.tag} has been warned. Warning count: ${warningCount}${escalationMessage}`, 
        ephemeral: true 
      });

      // Send public warning log to specific channel from env
      const warningChannelId = process.env.WARN_LOG_CHANNEL;
      if (warningChannelId) {
        const warningChannel = interaction.guild.channels.cache.get(warningChannelId);
        if (warningChannel) {
          await warningChannel.send({ embeds: [warningEmbed] });
        } else {
          console.error('Warning log channel not found:', warningChannelId);
        }
      } else {
        // Fallback to current channel if env var not set
        await interaction.followUp({ embeds: [warningEmbed] });
      }

    } catch (error) {
      console.error('Error in warn command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while processing the warning.', 
        ephemeral: true 
      });
    }
  }
};
