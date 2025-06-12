const CustomCommand = require('../database/models/CustomCommand');

module.exports = {
  async addCommand(cmd) {
    await CustomCommand.add(cmd);
  },
  async removeCommand(guildId, name) {
    await CustomCommand.remove(guildId, name);
  },
  async listCommands(guildId) {
    return await CustomCommand.list(guildId);
  }
};
