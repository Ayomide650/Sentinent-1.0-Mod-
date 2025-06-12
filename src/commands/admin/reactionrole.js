const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a reaction role panel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Panel title').setRequired(true))
        .addStringOption(opt => opt.setName('roles').setDescription('Comma-separated role:emoji pairs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a reaction role panel')
        .addStringOption(opt => opt.setName('message_id').setDescription('Message ID of the panel').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'create') {
      // Parse roles:emoji pairs and send embed with reactions
      await interaction.reply({ content: 'Reaction role panel creation coming soon!', ephemeral: true });
    } else if (interaction.options.getSubcommand() === 'remove') {
      // Remove reaction role panel logic
      await interaction.reply({ content: 'Reaction role panel removal coming soon!', ephemeral: true });
    }
  }
};
