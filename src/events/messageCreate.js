// src/events/messageCreate.js
const { PermissionFlagsBits } = require('discord.js');

// Import antilink utility functions
const antilinkCommand = require('../commands/moderation/antilink');
const { isAntilinkEnabled } = antilinkCommand;

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and system messages
    if (message.author.bot || message.system) return;
    
    // Ignore DMs
    if (!message.guild) return;
    
    try {
      const guildId = message.guild.id;
      const channelId = message.channel.id;
      
      // Check if antilink is enabled for this channel
      if (!isAntilinkEnabled(guildId, channelId)) return;
      
      // Check if message contains URLs
      const hasLinks = URL_REGEX.test(message.content);
      if (!hasLinks) return;
      
      // Check if user has permission to bypass antilink
      const member = message.member;
      if (member && (
        member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        member.permissions.has(PermissionFlagsBits.ManageChannels) ||
        member.permissions.has(PermissionFlagsBits.Administrator)
      )) {
        return; // Allow moderators to post links
      }
      
      // Delete the message with links
      await message.delete();
      
      // Send warning message (auto-delete after 5 seconds)
      const warningMessage = await message.channel.send({
        content: `🚫 ${message.author}, links are not allowed in this channel!`
      });
      
      // Delete warning message after 5 seconds
      setTimeout(() => {
        warningMessage.delete().catch(() => {
          // Ignore errors if message is already deleted
        });
      }, 5000);
      
      // Log the action
      console.log(`🔗 Deleted link from ${message.author.tag} in ${message.guild.name}/#${message.channel.name}`);
      
    } catch (error) {
      console.error('Error in antilink message handler:', error);
    }
  }
};
