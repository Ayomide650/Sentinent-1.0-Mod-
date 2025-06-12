const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome system')
    .addChannelOption(opt => opt.setName('channel').setDescription('Welcome channel').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Welcome message (use placeholders)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Save welcome channel and message to DB
    await interaction.reply({ content: 'Welcome system configuration coming soon!', ephemeral: true });
  }
};
