const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customcmd')
    .setDescription('Manage custom server commands')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a custom command')
        .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
        .addStringOption(opt => opt.setName('response').setDescription('Command response').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a custom command')
        .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all custom commands')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') {
      // Save custom command to DB
      await interaction.reply({ content: 'Custom command creation coming soon!', ephemeral: true });
    } else if (sub === 'delete') {
      // Remove custom command from DB
      await interaction.reply({ content: 'Custom command deletion coming soon!', ephemeral: true });
    } else if (sub === 'list') {
      // List all custom commands
      await interaction.reply({ content: 'Custom command listing coming soon!', ephemeral: true });
    }
  }
};
