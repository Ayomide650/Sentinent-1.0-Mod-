const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Set a custom command prefix')
    .addStringOption(opt => opt.setName('new_prefix').setDescription('New prefix').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const prefix = interaction.options.getString('new_prefix');
    // ...save prefix to your database...
    await interaction.reply({ content: `Prefix set to \`${prefix}\` for this server.`, ephemeral: true });
  }
};
