const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removexp')
    .setDescription('Remove XP from a user (admin only)')
    .addUserOption(opt => opt.setName('user').setDescription('User to remove XP from').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of XP').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    // ...remove XP from user in your database...
    await removeUserXp(interaction.guild.id, user.id, amount); // implement this
    await interaction.reply({ content: `Removed ${amount} XP from ${user.username}.`, ephemeral: true });
  }
};
