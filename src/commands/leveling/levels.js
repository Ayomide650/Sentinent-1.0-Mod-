const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const milestones = [5, 20, 35, 50, 70, 75, 90, 100];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Shows all milestone levels and rewards'),
  async execute(interaction) {
    // ...fetch user data if needed...
    const embed = new EmbedBuilder()
      .setTitle('Level Milestones & Rewards')
      .setColor(0x7289da);

    milestones.forEach(level => {
      embed.addFields({
        name: `Level ${level}`,
        value: `Reward: <@&ROLE_ID_FOR_LEVEL_${level}>`, // Replace with actual role logic
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
