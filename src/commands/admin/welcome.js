const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { supabase } = require('../../database/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome system')
    .addChannelOption(opt => 
      opt.setName('channel')
         .setDescription('Welcome channel')
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(opt => 
      opt.setName('message')
         .setDescription('Welcome message (use {user}, {server}, {memberCount} placeholders)')
         .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      const guildId = interaction.guild.id;

      // Validate channel type
      if (channel.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: '❌ Please select a text channel only.',
          ephemeral: true
        });
      }

      // Check if bot has permissions in the selected channel
      const botMember = interaction.guild.members.me;
      const permissions = channel.permissionsFor(botMember);
      
      if (!permissions.has(['ViewChannel', 'SendMessages'])) {
        return await interaction.reply({
          content: '❌ I don\'t have permission to send messages in that channel.',
          ephemeral: true
        });
      }

      // Save/update welcome configuration in database
      const { data, error } = await supabase
        .from('welcome_config')
        .upsert({
          guild_id: guildId,
          channel_id: channel.id,
          welcome_message: message,
          enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'guild_id'
        });

      if (error) {
        console.error('Database error:', error);
        return await interaction.reply({
          content: '❌ Failed to save welcome configuration. Please try again.',
          ephemeral: true
        });
      }

      // Send success message with preview
      const previewMessage = message
        .replace(/{user}/g, interaction.user.toString())
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount.toString());

      await interaction.reply({
        embeds: [{
          color: 0x00ff00,
          title: '✅ Welcome System Configured',
          fields: [
            {
              name: 'Channel',
              value: channel.toString(),
              inline: true
            },
            {
              name: 'Status',
              value: 'Enabled',
              inline: true
            },
            {
              name: 'Message Preview',
              value: previewMessage.length > 1000 ? previewMessage.substring(0, 997) + '...' : previewMessage,
              inline: false
            }
          ],
          footer: {
            text: 'Use placeholders: {user}, {server}, {memberCount}'
          }
        }],
        ephemeral: true
      });

    } catch (error) {
      console.error('Welcome command error:', error);
      await interaction.reply({
        content: '❌ An error occurred while configuring the welcome system.',
        ephemeral: true
      });
    }
  }
};
