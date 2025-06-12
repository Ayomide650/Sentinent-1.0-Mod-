const ModLog = require('../database/models/ModLog');
const Warning = require('../database/models/Warning');

module.exports = {
  async logAction(guildId, userId, moderatorId, action, reason, duration) {
    await ModLog.add({ guild_id: guildId, user_id: userId, moderator_id: moderatorId, action, reason, duration });
  },
  async warnUser(guildId, userId, moderatorId, reason, severity = 1) {
    await Warning.add({ guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason, severity });
  },
  async getWarnings(guildId, userId) {
    return await Warning.getUserWarnings(guildId, userId);
  }
};
