module.exports = {
  parseDuration(str) {
    // e.g. 1h, 30m, 2d
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const num = parseInt(match[1]);
    switch (match[2]) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return null;
    }
  },
  formatDuration(ms) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${d}d ${h}h ${m}m ${s}s`;
  }
};
