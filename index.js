// Bot initialization with automatic slash command deployment
// - Discord client setup with all intents
// - Database connection and initialization
// - Automatic slash command registration on startup
// - Event handler registration
// - Express server for health checks (PORT 3000)
// - Graceful shutdown handling
// - Enhanced error recovery system

const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- Express server for Render port binding and health checks ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Bot status endpoint
app.get('/bot-status', (req, res) => {
  if (client.isReady()) {
    res.json({
      status: 'ready',
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      ping: client.ws.ping
    });
  } else {
    res.json({ status: 'not ready' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
});

// --- Discord bot initialization ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();

// --- Slash Command Registration Function ---
async function deployCommands() {
  try {
    console.log('🔄 Starting slash command registration...');
    
    const commands = [];
    const commandFolders = fs.readdirSync(path.join(__dirname, 'src/commands'));
    
    // Load all commands from subfolders
    for (const folder of commandFolders) {
      const commandFiles = fs.readdirSync(path.join(__dirname, 'src/commands', folder))
        .filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(__dirname, 'src/commands', folder, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
          client.commands.set(command.data.name, command);
          console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
          console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property.`);
        }
      }
    }
    
    // Deploy commands to Discord
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    if (process.env.NODE_ENV === 'production') {
      // Global deployment for production
      console.log(`🌍 Deploying ${commands.length} commands globally...`);
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Successfully registered ${data.length} global commands.`);
    } else {
      // Guild-specific deployment for development (faster)
      if (process.env.GUILD_ID) {
        console.log(`🏠 Deploying ${commands.length} commands to guild ${process.env.GUILD_ID}...`);
        const data = await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`✅ Successfully registered ${data.length} guild commands.`);
      } else {
        console.log('⚠️  GUILD_ID not set, deploying globally...');
        const data = await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands }
        );
        console.log(`✅ Successfully registered ${data.length} global commands.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    throw error;
  }
}

// --- Initialize Database ---
async function initializeDatabase() {
  try {
    console.log('🗄️  Initializing database...');
    
    // Check if database handler exists
    const dbPath = path.join(__dirname, 'src/database/database.js');
    if (fs.existsSync(dbPath)) {
      const database = require(dbPath);
      if (typeof database.initialize === 'function') {
        await database.initialize();
        console.log('✅ Database initialized successfully');
      }
    } else {
      console.log('⚠️  Database handler not found, skipping database initialization');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw - allow bot to continue without database if needed
  }
}

// --- Load Handlers ---
function loadHandlers() {
  try {
    console.log('📂 Loading handlers...');
    
    // Load command handler (if exists and different from our built-in)
    const commandHandlerPath = path.join(__dirname, 'src/handlers/commandHandler.js');
    if (fs.existsSync(commandHandlerPath)) {
      require(commandHandlerPath)(client);
      console.log('✅ Command handler loaded');
    }
    
    // Load event handler
    const eventHandlerPath = path.join(__dirname, 'src/handlers/eventHandler.js');
    if (fs.existsSync(eventHandlerPath)) {
      require(eventHandlerPath)(client);
      console.log('✅ Event handler loaded');
    }
    
    // Load error handler
    const errorHandlerPath = path.join(__dirname, 'src/handlers/errorHandler.js');
    if (fs.existsSync(errorHandlerPath)) {
      require(errorHandlerPath)(client);
      console.log('✅ Error handler loaded');
    }
    
  } catch (error) {
    console.error('❌ Error loading handlers:', error);
    throw error;
  }
}

// --- Bot Event Handlers ---
client.once('ready', async () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);
  
  // Set bot status
  client.user.setActivity('Managing your server', { type: 'WATCHING' });
  
  try {
    // Initialize database
    await initializeDatabase();
    
    // Deploy slash commands
    await deployCommands();
    
    console.log('🚀 Bot is fully ready and operational!');
  } catch (error) {
    console.error('❌ Error during bot initialization:', error);
  }
});

// Handle interactions (slash commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    return;
  }
  
  // Cooldown handling
  const { cooldowns } = client;
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
  
  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
        ephemeral: true
      });
    }
  }
  
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  
  // Execute command
  try {
    await command.execute(interaction);
    console.log(`✅ ${interaction.user.tag} used /${command.data.name}`);
  } catch (error) {
    console.error(`❌ Error executing ${command.data.name}:`, error);
    
    const errorMessage = {
      content: 'There was an error while executing this command!',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// --- Error Handling ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    server.close(() => {
      console.log('🌐 HTTP server closed');
    });
    
    client.destroy();
    console.log('🤖 Discord client destroyed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  try {
    server.close(() => {
      console.log('🌐 HTTP server closed');
    });
    
    client.destroy();
    console.log('🤖 Discord client destroyed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// --- Start the bot ---
async function startBot() {
  try {
    console.log('🚀 Starting bot initialization...');
    
    // Load handlers first
    loadHandlers();
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot();
