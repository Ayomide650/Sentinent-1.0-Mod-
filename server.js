// server.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Bot is running.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Bot status endpoint (optional)
app.get('/bot-status', (req, res) => {
  if (global.discordClient && global.discordClient.isReady()) {
    res.json({
      status: 'ready',
      guilds: global.discordClient.guilds.cache.size,
      users: global.discordClient.users.cache.size,
      ping: global.discordClient.ws.ping
    });
  } else {
    res.json({ status: 'not ready' });
  }
});

export function keepAlive(client = null) {
  // Store client reference globally for bot-status endpoint
  if (client) {
    global.discordClient = client;
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on port ${PORT}`);
  });
  
  // Self-ping every 14 minutes to prevent Render from sleeping the service
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
  
  // Wait 2 minutes before starting pings to allow server to fully start
  setTimeout(() => {
    setInterval(async () => {
      try {
        // Get your Render app URL from environment or construct it
        const appUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const response = await fetch(`${appUrl}/health`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Self-ping successful: ${response.status} at ${data.timestamp}`);
        } else {
          console.log(`⚠️ Self-ping returned: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Self-ping failed: ${error.message}`);
        
        // If external URL fails, try localhost as fallback
        try {
          const response = await fetch(`http://localhost:${PORT}/health`);
          if (response.ok) {
            console.log(`✅ Self-ping successful (localhost fallback): ${response.status}`);
          }
        } catch (fallbackError) {
          console.log(`❌ Self-ping localhost fallback also failed: ${fallbackError.message}`);
        }
      }
    }, PING_INTERVAL);
    
    console.log(`🔄 Self-ping scheduled every ${PING_INTERVAL / 60000} minutes`);
  }, 2 * 60 * 1000); // 2 minute delay
  
  return server;
}
