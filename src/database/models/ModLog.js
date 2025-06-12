const db = require('../database');

module.exports = {
  async add(log) {
    await db.from('mod_logs').insert(log);
  },
  async list(guild_id, user_id) {
    const { data } = await db.from('mod_logs').select('*').eq('guild_id', guild_id).eq('user_id', user_id);
    return data;
  }
};
