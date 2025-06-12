const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get support and documentation links'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Support & Resources')
      .setDescription('• [Support Server](https://discord.gg/support)\n• [Documentation](https://docs.example.com)\n• [FAQ](https://docs.example.com/faq)')
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
