const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monthlylb')
    .setDescription('Shows the monthly XP leaderboard'),
  async execute(interaction) {
    // Fetch monthly leaderboard data from your database
    const leaderboard = await getMonthlyLeaderboard(interaction.guild.id); // implement this
    if (!leaderboard.length) return interaction.reply({ content: 'No monthly data found.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Monthly XP Leaderboard')
      .setColor(0xf1c40f);

    leaderboard.forEach((entry, i) => {
      embed.addFields({
        name: `#${i + 1} ${entry.username}`,
        value: `XP Gained: ${entry.monthlyXp} | Level: ${entry.level}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};

// Implement getMonthlyLeaderboard(guildId) in your db utils
