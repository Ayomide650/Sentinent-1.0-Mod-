const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows the server XP leaderboard')
    .addIntegerOption(opt => opt.setName('page').setDescription('Leaderboard page').setMinValue(1)),
  async execute(interaction) {
    const page = interaction.options.getInteger('page') || 1;
    const pageSize = 10;
    // Fetch leaderboard data from your database
    const leaderboard = await getLeaderboard(interaction.guild.id, page, pageSize); // implement this
    if (!leaderboard.length) return interaction.reply({ content: 'No leaderboard data found.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Server Leaderboard')
      .setColor(0x43b581)
      .setFooter({ text: `Page ${page}` });

    leaderboard.forEach((entry, i) => {
      embed.addFields({
        name: `#${(page - 1) * pageSize + i + 1} ${entry.username}`,
        value: `Level: ${entry.level} | XP: ${entry.xp}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};

// Implement getLeaderboard(guildId, page, pageSize) in your db utils
