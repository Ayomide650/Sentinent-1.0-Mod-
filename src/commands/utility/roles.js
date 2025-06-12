const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Show all roles and their info')
    .addUserOption(opt => opt.setName('user').setDescription('User to show roles for').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    let roles;
    if (user) {
      const member = await interaction.guild.members.fetch(user.id);
      roles = member.roles.cache;
    } else {
      roles = interaction.guild.roles.cache;
    }
    const embed = new EmbedBuilder()
      .setTitle(user ? `${user.username}'s Roles` : 'Server Roles')
      .setDescription(roles.map(r => `<@&${r.id}>`).join(', '))
      .setColor(0x7289da);
    await interaction.reply({ embeds: [embed] });
  }
};
