const ReactionRole = require('../database/models/ReactionRole');

module.exports = {
  async addReactionRole(data) {
    await ReactionRole.add(data);
  },
  async removeReactionRole(id) {
    await ReactionRole.remove(id);
  },
  async getReactionRoles(guildId) {
    return await ReactionRole.list(guildId);
  }
};
