const db = require('../database/database');

module.exports = {
  async logCommandUsage(command, userId, guildId) {
    await db.from('commands_log').insert({ command, user_id: userId, guild_id: guildId, used_at: new Date().toISOString() });
  },
  async getCommandStats(command) {
    const { data } = await db.from('commands_log').select('*').eq('command', command);
    return data;
  }
};
