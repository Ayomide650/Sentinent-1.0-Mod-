const db = require('../database');

module.exports = {
  async add(rr) {
    await db.from('reaction_roles').insert(rr);
  },
  async remove(id) {
    await db.from('reaction_roles').delete().eq('id', id);
  },
  async list(guild_id) {
    const { data } = await db.from('reaction_roles').select('*').eq('guild_id', guild_id);
    return data;
  }
};
