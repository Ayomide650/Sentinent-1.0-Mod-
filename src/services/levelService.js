const { getXpForLevel } = require('../utils/xpCalculator');
const { MILESTONE_LEVELS } = require('../utils/constants');

module.exports = {
  getMilestone(level) {
    return MILESTONE_LEVELS.filter(lvl => lvl <= level).pop() || null;
  },
  getNextMilestone(level) {
    return MILESTONE_LEVELS.find(lvl => lvl > level) || null;
  },
  getXpToNextLevel(xp, level) {
    return getXpForLevel(level + 1) - xp;
  }
};
