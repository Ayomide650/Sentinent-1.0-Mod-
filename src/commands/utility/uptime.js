const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatUptime(ms) {
  const sec = Math.floor((ms / 1000) % 60);
  const min = Math.floor((ms / (1000 * 60)) % 60);
  const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const day = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${day}d ${hr}h ${min}m ${sec}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Detailed uptime statistics'),
  async execute(interaction) {
    const uptime = formatUptime(interaction.client.uptime);
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Uptime')
      .setDescription(`Current session uptime: **${uptime}**`)
      .setColor(0x7289da);
    await interaction.reply({ embeds: [embed] });
  }
};
