const User = require('../database/models/User');
const { randomInt } = require('../utils/helpers');
const { XP_PER_MESSAGE_MIN, XP_PER_MESSAGE_MAX, XP_COOLDOWN } = require('../utils/constants');
const { getXpForLevel } = require('../utils/xpCalculator');

module.exports = {
  async grantXp(guildId, userId) {
    const xp = randomInt(XP_PER_MESSAGE_MIN, XP_PER_MESSAGE_MAX);
    const user = await User.get(guildId, userId) || { guild_id: guildId, user_id: userId, xp: 0, level: 1 };
    user.xp = (user.xp || 0) + xp;
    const newLevel = this.calculateLevel(user.xp);
    let leveledUp = false;
    if (newLevel > (user.level || 1)) {
      user.level = newLevel;
      leveledUp = true;
    }
    await User.upsert(user);
    return { xp, newLevel, leveledUp };
  },
  calculateLevel(xp) {
    let level = 1;
    while (xp >= getXpForLevel(level + 1)) level++;
    return level;
  }
};
