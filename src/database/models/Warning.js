const db = require('../database');

module.exports = {
  async add(warning) {
    await db.from('warnings').insert(warning);
  },
  async getUserWarnings(guild_id, user_id) {
    const { data } = await db.from('warnings').select('*').eq('guild_id', guild_id).eq('user_id', user_id).order('created_at', { ascending: false });
    return data;
  },
  async remove(id) {
    await db.from('warnings').delete().eq('id', id);
  }
};
