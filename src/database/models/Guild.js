const db = require('../database');

module.exports = {
  async get(guild_id) {
    const { data } = await db.from('guild_settings').select('*').eq('guild_id', guild_id).single();
    return data;
  },
  async upsert(settings) {
    await db.from('guild_settings').upsert(settings, { onConflict: ['guild_id'] });
  },
  // ...other guild-related methods...
};
