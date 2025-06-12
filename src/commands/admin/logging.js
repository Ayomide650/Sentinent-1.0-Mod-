const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logging')
    .setDescription('Configure logging channels')
    .addChannelOption(opt => opt.setName('log_channel').setDescription('General log channel').setRequired(false))
    .addChannelOption(opt => opt.setName('ban_log_channel').setDescription('Ban log channel').setRequired(false))
    .addChannelOption(opt => opt.setName('warn_log_channel').setDescription('Warn log channel').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Save logging channels to DB
    await interaction.reply({ content: 'Logging system configuration coming soon!', ephemeral: true });
  }
};
