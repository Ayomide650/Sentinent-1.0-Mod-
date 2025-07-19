const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('View environment configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
  async execute(interaction) {
    try {
      // Get ALL environment variables that are actually set
      const envVars = {};
      
      // Get all environment variables
      Object.keys(process.env).forEach(key => {
        const value = process.env[key];
        
        // Hide sensitive values
        if (key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
          envVars[key] = `${value.substring(0, 4)}${'*'.repeat(Math.max(0, value.length - 8))}${value.substring(value.length - 4)}`;
        } else if (key.includes('URL') || key.includes('URI')) {
          // Show partial URLs
          try {
            const url = new URL(value);
            envVars[key] = `${url.protocol}//${url.hostname}/*****`;
          } catch {
            envVars[key] = `${value.substring(0, 10)}*****`;
          }
        } else {
          // For regular values, truncate if too long
          envVars[key] = value.length > 50 ? `${value.substring(0, 47)}...` : value;
        }
      });
      
      // Build the embed
      let description = '```\n';
      description += '🔧 ENVIRONMENT VARIABLES\n';
      description += '═'.repeat(40) + '\n\n';
      
      // Sort environment variables alphabetically
      const sortedEnvVars = Object.entries(envVars).sort(([a], [b]) => a.localeCompare(b));
      
      sortedEnvVars.forEach(([key, value]) => {
        description += `✅ ${key.padEnd(20)}: ${value}\n`;
      });
      
      description += `\nTotal: ${Object.keys(envVars).length} variables`;
      description += '```';
      
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Server Configuration')
        .setDescription(description)
        .setColor(0x00ff00)
        .setFooter({ 
          text: 'Sensitive values are masked for security',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      
    } catch (error) {
      console.error('Error in settings command:', error);
      await interaction.reply({
        content: 'An error occurred while fetching environment settings.',
        ephemeral: true
      });
    }
  }
};
