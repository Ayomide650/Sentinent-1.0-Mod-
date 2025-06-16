const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by user ID')
    .addStringOption(opt => opt.setName('user_id').setDescription('User ID to unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    try {
      const userId = interaction.options.getString('user_id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const moderator = interaction.user;
      const guildId = interaction.guild.id;

      // Validate user ID format
      if (!/^\d{17,19}$/.test(userId)) {
        return await interaction.reply({ 
          content: '❌ Invalid user ID format! Please provide a valid Discord user ID.', 
          ephemeral: true 
        });
      }

      // Check if user is currently banned
      let bannedUser = null;
      try {
        const banList = await interaction.guild.bans.fetch();
        bannedUser = banList.get(userId);
        
        if (!bannedUser) {
          return await interaction.reply({ 
            content: '❌ User is not currently banned!', 
            ephemeral: true 
          });
        }
      } catch (error) {
        console.error('Error fetching ban list:', error);
        return await interaction.reply({ 
          content: '❌ Failed to check ban list. Please try again.', 
          ephemeral: true 
        });
      }

      // Get user info (username/tag)
      let targetUser = null;
      try {
        targetUser = await interaction.client.users.fetch(userId);
      } catch (error) {
        // User might not exist anymore, use ID only
        console.log('Could not fetch user info:', error.message);
      }

      const userDisplayName = targetUser ? targetUser.tag : `User ID: ${userId}`;

      // Execute the unban
      try {
        await interaction.guild.members.unban(userId, `${reason} | Unbanned by: ${moderator.tag}`);
      } catch (unbanError) {
        console.error('Error unbanning user:', unbanError);
        return await interaction.reply({ 
          content: '❌ Failed to unban user. Please check the user ID and try again.', 
          ephemeral: true 
        });
      }

      // Update ban record in database
      const { error: updateError } = await supabase
        .from('bans')
        .update({ 
          unbanned_at: new Date().toISOString(),
          unbanned_by: moderator.id,
          unban_reason: reason
        })
        .eq('user_id', userId)
        .eq('guild_id', guildId)
        .is('unbanned_at', null);

      if (updateError) {
        console.error('Error updating ban record:', updateError);
        // Don't return error here as unban was successful, just log it
      }

      // Create unban embed for public channel
      const unbanEmbed = new EmbedBuilder()
        .setColor('#28A745')
        .setTitle('🔓 User Unbanned')
        .addFields(
          { name: 'User', value: targetUser ? `<@${userId}>` : `User ID: ${userId}`, inline: true },
          { name: 'Unbanned by', value: `<@${moderator.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `User ID: ${userId}` });

      // Add original ban reason if available
      if (bannedUser && bannedUser.reason) {
        unbanEmbed.addFields({ 
          name: 'Original Ban Reason', 
          value: bannedUser.reason, 
          inline: false 
        });
      }

      // Reply to the command (ephemeral)
      const replyMessage = `✅ ${userDisplayName} has been unbanned. Reason: ${reason}`;
      await interaction.reply({ 
        content: replyMessage, 
        ephemeral: true 
      });

      // Send public unban log to specific channel from env
      const banChannelId = process.env.BAN_LOG_CHANNEL;
      if (banChannelId) {
        const banChannel = interaction.guild.channels.cache.get(banChannelId);
        if (banChannel) {
          await banChannel.send({ embeds: [unbanEmbed] });
        } else {
          console.error('Ban log channel not found:', banChannelId);
        }
      } else {
        // Fallback to current channel if env var not set
        await interaction.followUp({ embeds: [unbanEmbed] });
      }

    } catch (error) {
      console.error('Error in unban command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while processing the unban.', 
        ephemeral: true 
      });
    }
  }
};
