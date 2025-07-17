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
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  // Wait 3 minutes before starting pings to allow server to fully start
  setTimeout(() => {
    setInterval(async () => {
      try {
        // Get your Render app URL from environment or construct it
        const appUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${appUrl}/health`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'KeepAlive-Bot/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Self-ping successful: ${response.status} at ${data.timestamp}`);
        } else if (response.status === 503) {
          console.log(`⚠️ Service temporarily unavailable (503) - likely still starting up`);
        } else {
          console.log(`⚠️ Self-ping returned: ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`❌ Self-ping timed out after 30 seconds`);
        } else {
          console.log(`❌ Self-ping failed: ${error.message}`);
        }
        
        // If external URL fails, try localhost as fallback
        try {
          const response = await fetch(`http://localhost:${PORT}/health`, {
            headers: { 'User-Agent': 'KeepAlive-Bot/1.0' }
          });
          if (response.ok) {
            console.log(`✅ Self-ping successful (localhost fallback): ${response.status}`);
          }
        } catch (fallbackError) {
          console.log(`❌ Self-ping localhost fallback also failed: ${fallbackError.message}`);
        }
      }
    }, PING_INTERVAL);
    
    console.log(`🔄 Self-ping scheduled every ${PING_INTERVAL / 60000} minutes`);
  }, 3 * 60 * 1000); // 3 minute delay
  
  return server;
}
