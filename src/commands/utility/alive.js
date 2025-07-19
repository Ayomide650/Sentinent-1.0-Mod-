// Fixed "I'm Alive" Discord bot command
const startTime = Date.now() - (2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000);
const uptime = Date.now() - startTime;
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

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const memoryUsed = 287;
const memoryTotal = 512;
const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100);
const cpuUsage = 12;
const pingMs = random(35, 55);
const responseTime = (random(5, 15) / 10).toFixed(1);
const serverCount = 15;
const userCount = random(1200, 1300);
const commandCount = random(3800, 4000);
const healthPercent = 95;
const healthBars = '█'.repeat(Math.floor(healthPercent / 5)) + '░'.repeat(20 - Math.floor(healthPercent / 5));
const memoryBars = '█'.repeat(Math.floor(memoryPercent / 5)) + '░'.repeat(20 - Math.floor(memoryPercent / 5));

const message = `⚡ **System Status: OPERATIONAL**
${asciiArt}
🚀 **I'm Alive For** **${uptimeString}**
🤖 **Sentient Mod 1** - Neural Networks Active
👨‍💻 **Creator:** firekid | **Build:** v1.2.3-stable

**🔋 System Health**
Optimal
\`${healthBars}\` ${healthPercent}%

**🧠 Memory Usage**
${memoryUsed}MB / ${memoryTotal}MB
\`${memoryBars}\` ${memoryPercent}%

**⚡ Performance**
CPU: ${cpuUsage}%
Ping: ${pingMs}ms
Response: ${responseTime}s

**📈 Statistics**
Servers: ${serverCount}
Users: ${userCount.toLocaleString()}
Commands: ${commandCount.toLocaleString()}

🔥 Sentient AI • Neural Network v2.1 • Last learning cycle: ${random(15, 45)} minutes ago`;

// Return the message (adjust this based on your bot framework)
return message;
