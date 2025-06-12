const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Complete bot statistics'),
  async execute(interaction) {
    const client = interaction.client;
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Users', value: `${client.users.cache.size}`, inline: true },
        { name: 'Commands', value: `${client.commands?.size || 'N/A'}`, inline: true },
        { name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: 'CPU', value: os.cpus()[0].model, inline: true },
        { name: 'Node.js', value: process.version, inline: true }
      )
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed] });
  }
};
