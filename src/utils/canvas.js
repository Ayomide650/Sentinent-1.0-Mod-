const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

registerFont(path.join(__dirname, '../../assets/fonts/roboto.ttf'), { family: 'Roboto' });

module.exports = {
  createRankCard({ username, avatarURL, level, xp, xpNeeded, rank }) {
    const canvas = createCanvas(600, 180);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar
    return loadImage(avatarURL).then(avatar => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(90, 90, 64, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 26, 26, 128, 128);
      ctx.restore();

      ctx.font = 'bold 28px Roboto';
      ctx.fillStyle = '#fff';
      ctx.fillText(username, 170, 60);

      ctx.font = '20px Roboto';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`Level: ${level}   XP: ${xp}`, 170, 95);

      // Progress bar
      ctx.fillStyle = '#444';
      ctx.fillRect(170, 120, 380, 24);
      ctx.fillStyle = '#43b581';
      ctx.fillRect(170, 120, 380 * (xp / xpNeeded), 24);

      ctx.font = '18px Roboto';
      ctx.fillStyle = '#fff';
      ctx.fillText(`Rank: #${rank}`, 170, 160);

      return canvas.toBuffer();
    });
  }
};
