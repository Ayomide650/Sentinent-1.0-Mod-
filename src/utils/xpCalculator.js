const { LEVEL_MULTIPLIER, STARTING_MESSAGES, XP_PER_MESSAGE_MIN, XP_PER_MESSAGE_MAX } = require('./constants');

module.exports = {
  getXpForLevel(level) {
    if (level <= 1) return 0;
    let xp = 0;
    for (let i = 1; i < level; i++) {
      xp += Math.round(((XP_PER_MESSAGE_MIN + XP_PER_MESSAGE_MAX) / 2) * STARTING_MESSAGES * Math.pow(LEVEL_MULTIPLIER, i - 1));
    }
    return xp;
  },
  getLevelFromXp(xp) {
    let level = 1;
    while (xp >= this.getXpForLevel(level + 1)) level++;
    return level;
  }
};
