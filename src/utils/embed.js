const { EmbedBuilder } = require('discord.js');

module.exports = {
  success(description) {
    return new EmbedBuilder().setDescription(description).setColor(0x43b581);
  },
  error(description) {
    return new EmbedBuilder().setDescription(description).setColor(0xed4245);
  },
  info(description) {
    return new EmbedBuilder().setDescription(description).setColor(0x5865f2);
  }
};
