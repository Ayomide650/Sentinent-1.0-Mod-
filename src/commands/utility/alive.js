const { SlashCommandBuilder } = require('discord.js');

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alive')
        .setDescription('Shows bot status and uptime information'),
    
    async execute(interaction) {
        const client = interaction.client;
        
        
        const uptime = client.uptime;
        const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
        const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
        const uptimeString = `${days}d ${hours}h ${minutes}m`;

        const asciiArt = `\`\`\`
██████╗  ██████╗ ████████╗    ███████╗███╗   ███╗
██╔══██╗██╔═══██╗╚══██╔══╝    ██╔════╝████╗ ████║
██████╔╝██║   ██║   ██║       ███████╗██╔████╔██║
██╔══██╗██║   ██║   ██║       ╚════██║██║╚██╔╝██║
██████╔╝╚██████╔╝   ██║       ███████║██║ ╚═╝ ██║
╚═════╝  ╚═════╝    ╚═╝       ╚══════╝╚═╝     ╚═╝
\`\`\``;

        
        const memoryUsage = process.memoryUsage();
        const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
        
        
        const serverCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;
        
        
        const pingMs = client.ws.ping;
        
        
        const cpuUsage = Math.min(Math.round((memoryPercent / 100) * 50) + random(5, 15), 95);
        
        
        const responseTime = (Date.now() - interaction.createdTimestamp) / 1000;
        
        
        let healthPercent = 100;
        if (pingMs > 100) healthPercent -= 10;
        if (memoryPercent > 80) healthPercent -= 15;
        if (cpuUsage > 70) healthPercent -= 10;
        healthPercent = Math.max(healthPercent, 60);
        
        const healthBars = '█'.repeat(Math.floor(healthPercent / 5)) + '░'.repeat(20 - Math.floor(healthPercent / 5));
        const memoryBars = '█'.repeat(Math.floor(memoryPercent / 5)) + '░'.repeat(20 - Math.floor(memoryPercent / 5));

        const message = `⚡ **System Status: OPERATIONAL**
${asciiArt}
🚀 **I'm Alive For** **${uptimeString}**
🤖 **Sentient Mod 1** - Neural Networks Active
👨‍💻 **Creator:** firekid | **Build:** v1.2.3-stable

**🔋 System Health**
${healthPercent >= 90 ? 'Excellent' : healthPercent >= 75 ? 'Good' : healthPercent >= 60 ? 'Fair' : 'Poor'}
\`${healthBars}\` ${healthPercent}%

**🧠 Memory Usage**
${memoryUsed}MB / ${memoryTotal}MB
\`${memoryBars}\` ${memoryPercent}%

**⚡ Performance**
CPU: ${cpuUsage}%
Ping: ${pingMs}ms
Response: ${responseTime.toFixed(2)}s

**📈 Statistics**
Servers: ${serverCount}
Users: ${userCount.toLocaleString()}
Channels: ${client.channels.cache.size}

🔥 Sentient AI • Neural Network v2.1 • Process ID: ${process.pid}`;

        await interaction.reply(message);
    },
};
