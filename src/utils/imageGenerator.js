const { createCanvas, loadImage } = require('canvas');

module.exports = {
  async generateWelcomeCard({ username, avatarURL, memberCount }) {
    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 25, 25, 200, 200);
    ctx.restore();

    ctx.font = 'bold 40px Sans';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Welcome, ${username}!`, 250, 100);
    ctx.font = '28px Sans';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Member #${memberCount}`, 250, 160);

    return canvas.toBuffer();
  }
};
