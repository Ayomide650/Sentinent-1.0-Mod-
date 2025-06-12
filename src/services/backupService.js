const db = require('../database/database');

module.exports = {
  async backupTable(table) {
    const { data } = await db.from(table).select('*');
    return data;
  },
  async restoreTable(table, rows) {
    for (const row of rows) {
      await db.from(table).upsert(row);
    }
  }
};
