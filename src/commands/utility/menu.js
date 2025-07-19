const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menu')
        .setDescription('Display bot information and available commands'),
    
    async execute(interaction) {
        try {
            // Get system information
            const serverName = interaction.guild?.name || 'DM Channel';
            const channelName = interaction.channel?.name || 'DM';
            const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
            const uptime = formatUptime(process.uptime());
            const ping = interaction.client.ws.ping;
            const user = interaction.user.tag;
            
            // Build the menu content with fancy styling
            let menuContent = `\`\`\`
╔══════════════════════════════════════════════════════════════════════╗
║                          SENTINENT MOD 1.0                          ║
╠══════════════════════════════════════════════════════════════════════╣
║ Server: ${serverName.padEnd(58)} ║
║ Channel: #${channelName.padEnd(56)} ║
║ RAM: ${(memoryUsage + ' MB').padEnd(61)} ║
║ Uptime: ${uptime.padEnd(59)} ║
║ Ping: ${(ping + 'ms').padEnd(60)} ║
║ Ran by ${user.padEnd(58)} ║
╚══════════════════════════════════════════════════════════════════════╝

`;

            // Scan commands directory
            const commandsPath = path.join(__dirname, '../../commands');
            
            if (fs.existsSync(commandsPath)) {
                const commandFolders = fs.readdirSync(commandsPath)
                    .filter(item => fs.statSync(path.join(commandsPath, item)).isDirectory());
                
                for (let i = 0; i < commandFolders.length; i++) {
                    const folder = commandFolders[i];
                    const folderPath = path.join(commandsPath, folder);
                    
                    // Add folder name
                    menuContent += `${folder}\n`;
                    
                    // Get command files in this folder
                    const commandFiles = fs.readdirSync(folderPath)
                        .filter(file => file.endsWith('.js'))
                        .sort();
                    
                    // Add command files with tree structure
                    for (let j = 0; j < commandFiles.length; j++) {
                        const file = commandFiles[j];
                        const isLast = j === commandFiles.length - 1;
                        
                        if (isLast) {
                            menuContent += `└── ${file}\n`;
                        } else {
                            menuContent += `├── ${file}\n`;
                        }
                    }
                    
                    // Add spacing between folders (except for last folder)
                    if (i < commandFolders.length - 1) {
                        menuContent += `\n`;
                    }
                }
            } else {
                menuContent += `❌ Commands directory not found\n`;
            }
            
            menuContent += `\`\`\``;
            
            // Create embed for better presentation
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(menuContent)
                .setTimestamp()
                .setFooter({ 
                    text: `${interaction.client.user.username}`,
                    iconURL: interaction.client.user.displayAvatarURL() 
                });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in menu command:', error);
            await interaction.reply({ 
                content: 'An error occurred while generating the menu.', 
                ephemeral: true 
            });
        }
    }
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let uptime = '';
    if (days > 0) uptime += `${days}d `;
    if (hours > 0) uptime += `${hours}h `;
    if (minutes > 0) uptime += `${minutes}m `;
    uptime += `${secs}s`;
    
    return uptime;
}
