const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Reset a user\'s XP (admin only)')
    .addUserOption(opt => opt.setName('user').setDescription('User to reset').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    // ...reset user XP in your database...
    await resetUserXp(interaction.guild.id, user.id); // implement this
    await interaction.reply({ content: `Reset XP for ${user.username}.`, ephemeral: true });
  }
};
