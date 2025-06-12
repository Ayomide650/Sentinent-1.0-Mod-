const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure auto-moderation system')
    .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable automod').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Save automod setting to DB
    await interaction.reply({ content: 'Auto-moderation configuration coming soon!', ephemeral: true });
  }
};
