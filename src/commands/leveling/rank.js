const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Displays your or another user\'s rank card')
    .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(false)),
  async execute(interaction) {
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
  }
};

// Helper functions (implement these in your utils/db)
function getUserLevelData(guildId, userId) {
  // ...existing code or import from your database utils...
}
function getXpForLevel(level) {
  // Example: 50 * (1.05 ^ (level-1)) messages * avg 20 XP per message
  // Replace with your actual XP curve
  if (level <= 1) return 0;
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.round(20 * 50 * Math.pow(1.05, i - 1));
  }
  return xp;
}
    // Rank position (optional)
    ctx.font = '18px Sans';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Rank: #${userData.rank || '?'}`, 170, 160);

    // Send as attachment
    const { AttachmentBuilder } = require('discord.js');
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank.png' });
    await interaction.reply({ files: [attachment] });
  }
};

// Helper functions (implement these in your utils/db)
function getXpForLevel(level) {
  // Example: 50 * (1.05 ^ (level-1)) messages * avg 20 XP per message
  // Replace with your actual XP curve
  if (level <= 1) return 0;
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.round(20 * 50 * Math.pow(1.05, i - 1));
  }
  return xp;
}
