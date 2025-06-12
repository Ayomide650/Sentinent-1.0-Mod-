const Guild = require('../database/models/Guild');
const { parsePlaceholders } = require('../utils/textParser');
const { generateWelcomeCard } = require('../utils/imageGenerator');

module.exports = {
  async sendWelcome(member, client) {
    const settings = await Guild.get(member.guild.id);
    if (!settings || !settings.welcome_channel) return;
    const channel = member.guild.channels.cache.get(settings.welcome_channel);
    if (!channel) return;
    const msg = parsePlaceholders(settings.welcome_message || 'Welcome {user} to {server}!', {
      user: `<@${member.id}>`,
      username: member.user.username,
      server: member.guild.name,
      membercount: member.guild.memberCount,
      date: new Date().toLocaleDateString(),
      account_age: Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)) + ' days'
    });
    const card = await generateWelcomeCard({
      username: member.user.username,
      avatarURL: member.user.displayAvatarURL(),
      memberCount: member.guild.memberCount
    });
    await channel.send({ content: msg, files: [{ attachment: card, name: 'welcome.png' }] });
  }
};
