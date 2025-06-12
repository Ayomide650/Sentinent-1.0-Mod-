const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Simple JSON database for storing antilink settings
const DB_FILE = path.join(__dirname, '../../database/antilink.json');

// Ensure database file exists
function ensureDatabase() {
  const dbDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}), 'utf8');
  }
}

// Load antilink settings from database
function loadAntilinkSettings() {
  try {
    ensureDatabase();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading antilink settings:', error);
    return {};
  }
}

// Save antilink settings to database
function saveAntilinkSettings(settings) {
  try {
    ensureDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving antilink settings:', error);
    return false;
  }
}

// Toggle antilink for a specific guild and channel
function toggleAntilink(guildId, channelId) {
  const settings = loadAntilinkSettings();
  
  // Initialize guild if it doesn't exist
  if (!settings[guildId]) {
    settings[guildId] = {};
  }
  
  // Toggle the channel setting
  const currentSetting = settings[guildId][channelId] || false;
  settings[guildId][channelId] = !currentSetting;
  
  // Save to database
  const saved = saveAntilinkSettings(settings);
  
  if (saved) {
    return settings[guildId][channelId];
  } else {
    throw new Error('Failed to save antilink settings to database');
  }
}

// Check if antilink is enabled for a channel
function isAntilinkEnabled(guildId, channelId) {
  const settings = loadAntilinkSettings();
  return settings[guildId]?.[channelId] || false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Toggle link deletion in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    try {
      // Defer reply in case database operation takes time
      await interaction.deferReply({ ephemeral: true });
      
      const guildId = interaction.guild.id;
      const channelId = interaction.channel.id;
      
      // Toggle antilink setting
      const enabled = toggleAntilink(guildId, channelId);
      
      // Create embed response
      const embed = new EmbedBuilder()
        .setTitle('🔗 Antilink Settings Updated')
        .setDescription(`Antilink is now **${enabled ? 'ENABLED' : 'DISABLED'}** in <#${channelId}>`)
        .setColor(enabled ? 0x00FF00 : 0xFF0000)
        .addFields(
          { 
            name: 'Status', 
            value: enabled ? '✅ Links will be deleted' : '❌ Links are allowed', 
            inline: true 
          },
          { 
            name: 'Channel', 
            value: `<#${channelId}>`, 
            inline: true 
          }
        )
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      await interaction.editReply({ embeds: [embed] });
      
      // Log the action
      console.log(`🔗 ${interaction.user.tag} ${enabled ? 'enabled' : 'disabled'} antilink in ${interaction.guild.name}/#${interaction.channel.name}`);
      
    } catch (error) {
      console.error('Error in antilink command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('There was an error updating the antilink settings. Please try again.')
        .setColor(0xFF0000)
        .setTimestamp();
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
  
  // Export utility functions for use in other files
  toggleAntilink,
  isAntilinkEnabled,
  loadAntilinkSettings
};
