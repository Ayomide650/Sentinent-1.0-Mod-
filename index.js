// Bot initialization, event loading, and server startup
// - Discord client setup with all intents
// - Database connection
// - Event handler registration
// - Express server for health checks (PORT 3000)
// - Graceful shutdown handling
// - Error recovery system

// --- Express server for Render port binding and health checks ---
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'online' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
});

// --- Discord bot initialization ---
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Load handlers
require('./src/handlers/commandHandler')(client);
require('./src/handlers/eventHandler')(client);
require('./src/handlers/errorHandler')(client);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
