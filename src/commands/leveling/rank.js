const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Displays your or another user\'s rank card')
    .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(false)),
  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;
      // Fetch user XP/level data from your database
      const userData = await getUserLevelData(interaction.guild.id, user.id); // implement this
      if (!userData) return interaction.reply({ content: 'No data found for this user.', ephemeral: true });

      // Simple embed rank card
      const xpForNext = getXpForLevel(userData.level + 1); // implement this
      const xpForCurrent = getXpForLevel(userData.level);
      const progress = ((userData.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100;

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Rank Card`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Level', value: `${userData.level}`, inline: true },
          { name: 'XP', value: `${userData.xp} / ${xpForNext}`, inline: true },
          { name: 'Progress', value: `${progress.toFixed(2)}% to next level`, inline: true },
          { name: 'Rank', value: `#${userData.rank || '?'}`, inline: true },
          { name: 'Total Messages', value: `${userData.messages || 0}`, inline: true },
          { name: 'Join Date', value: `<t:${Math.floor((userData.joinedAt || Date.now())/1000)}:D>`, inline: true }
        )
        .setColor(0x43b581)
        .setFooter({ text: 'Next milestone reward: TBD' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in rank command:', error);
      await interaction.reply({ 
        content: 'An error occurred while generating the rank card. Please try again later.', 
        ephemeral: true 
      });
    }
  }
};

// Helper functions (implement these in your utils/db)
function getUserLevelData(guildId, userId) {
  // This is a placeholder - implement your database query here
  // Should return: { level, xp, messages, rank, joinedAt }
  
  // Example return structure:
  return {
    level: 5,
    xp: 2500,
    messages: 125,
    rank: 10,
    joinedAt: Date.now()
  };
}

function getXpForLevel(level) {
  // XP calculation based on your documentation
  // Starting requirement: 50 messages for Level 1
  // Progressive multiplier: 1.05 per level
  // XP per message: 15-25 (avg 20)
  
  if (level <= 1) return 0;
  
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.round(20 * 50 * Math.pow(1.05, i - 1));
  }
  return xp;
}
