const Guild = require('../database/models/Guild');

module.exports = {
  async log(guild, type, message, client) {
    const settings = await Guild.get(guild.id);
    let channelId;
    if (type === 'ban') channelId = settings?.ban_log_channel;
    else if (type === 'warn') channelId = settings?.warn_log_channel;
    else channelId = settings?.log_channel;
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId);
    if (channel) await channel.send(message);
  }
};
