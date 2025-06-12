const { EmbedBuilder } = require('discord.js');

module.exports = {
  createPaginatedEmbed(items, page, pageSize, title = 'Leaderboard') {
    const totalPages = Math.ceil(items.length / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(items.slice(start, end).join('\n'))
      .setFooter({ text: `Page ${page} of ${totalPages}` })
      .setColor(0x7289da);
    return embed;
  }
};
