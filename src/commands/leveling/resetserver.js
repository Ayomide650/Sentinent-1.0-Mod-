const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetserver')
    .setDescription('Reset ALL server XP (admin only, irreversible)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // ...reset all XP for this guild in your database...
    await resetAllServerXp(interaction.guild.id); // implement this
    await interaction.reply({ content: 'All server XP has been reset.', ephemeral: true });
  }
};
