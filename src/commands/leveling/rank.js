const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
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

    // Create rank card
    const canvas = createCanvas(600, 180);
    const ctx = canvas.getContext('2d');
    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(90, 90, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 26, 26, 128, 128);
    ctx.restore();

    // Username
    ctx.font = 'bold 28px Sans';
    ctx.fillStyle = '#fff';
    ctx.fillText(user.username, 170, 60);

    // Level & XP
    ctx.font = '20px Sans';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Level: ${userData.level}   XP: ${userData.xp}`, 170, 95);

    // Progress bar
    const xpForNext = getXpForLevel(userData.level + 1); // implement this
    const xpForCurrent = getXpForLevel(userData.level);
    const progress = (userData.xp - xpForCurrent) / (xpForNext - xpForCurrent);
    ctx.fillStyle = '#444';
    ctx.fillRect(170, 120, 380, 24);
    ctx.fillStyle = '#43b581';
    ctx.fillRect(170, 120, 380 * progress, 24);

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
