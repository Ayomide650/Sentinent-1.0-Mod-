const db = require('../database');

module.exports = {
  async add(cmd) {
    await db.from('custom_commands').insert(cmd);
  },
  async remove(guild_id, name) {
    await db.from('custom_commands').delete().eq('guild_id', guild_id).eq('name', name);
  },
  async list(guild_id) {
    const { data } = await db.from('custom_commands').select('*').eq('guild_id', guild_id);
    return data;
  }
};
