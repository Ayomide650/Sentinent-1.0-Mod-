const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/warning system...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user and log the warning')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    // ...save warning to database, escalation logic, DM, logging...
    await interaction.reply({ content: `Warned ${user.tag}. Reason: ${reason}`, ephemeral: true });
  }
};
