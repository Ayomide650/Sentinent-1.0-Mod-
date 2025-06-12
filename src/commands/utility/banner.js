const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Display a user\'s banner')
    .addUserOption(opt => opt.setName('user').setDescription('User to show').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const fetchedUser = await interaction.client.users.fetch(user.id, { force: true });
    const bannerURL = fetchedUser.bannerURL({ size: 512 });
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Banner`)
      .setImage(bannerURL || 'https://via.placeholder.com/512x200?text=No+Banner')
      .setColor(0x43b581);
    await interaction.reply({ embeds: [embed] });
  }
};
