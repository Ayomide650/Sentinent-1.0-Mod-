const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weeklylb')
    .setDescription('Shows the weekly XP leaderboard'),
  async execute(interaction) {
    // Fetch weekly leaderboard data from your database
    const leaderboard = await getWeeklyLeaderboard(interaction.guild.id); // implement this
    if (!leaderboard.length) return interaction.reply({ content: 'No weekly data found.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Weekly XP Leaderboard')
      .setColor(0x7289da);

    leaderboard.forEach((entry, i) => {
      embed.addFields({
        name: `#${i + 1} ${entry.username}`,
        value: `XP Gained: ${entry.weeklyXp} | Level: ${entry.level}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};

// Implement getWeeklyLeaderboard(guildId) in your db utils
