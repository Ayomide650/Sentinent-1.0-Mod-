const Guild = require('../database/models/Guild');

module.exports = {
  async checkMessage(message) {
    const settings = await Guild.get(message.guild.id);
    if (!settings || !settings.automod_enabled) return false;
    // Example: simple word filter
    const blacklist = settings.settings_json?.blacklist || [];
    if (blacklist.some(word => message.content.toLowerCase().includes(word))) {
      await message.delete();
      return true;
    }
    // Add anti-link, anti-spam, etc. as needed
    return false;
  }
};
