const db = require('../database');

module.exports = {
  async get(guild_id, user_id) {
    const { data } = await db.from('users').select('*').eq('guild_id', guild_id).eq('user_id', user_id).single();
    return data;
  },
  async upsert(user) {
    await db.from('users').upsert(user, { onConflict: ['guild_id', 'user_id'] });
  },
  async addXp(guild_id, user_id, xp) {
    await db.rpc('add_xp', { guild_id, user_id, xp });
  },
  // ...other user-related methods...
};
