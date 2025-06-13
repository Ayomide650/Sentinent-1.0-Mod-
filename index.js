// Bot initialization with automatic slash command deployment
// - Discord client setup with all intents
// - Database connection and initialization
// - Automatic slash command registration on startup
// - Event handler registration
// - Express server for health checks (PORT 3000)
// - Graceful shutdown handling
// - Enhanced error recovery system
// - Integrated XP and leveling system

const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import leveling system
const { createClient } = require('@supabase/supabase-js');
const levelService = require('./src/services/levelService');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

// XP cooldown system (prevent spam)
client.xpCooldowns = new Collection();

// --- Leveling System Functions ---
async function getUserLevel(guildId, userId) {
  try {
    const { data, error } = await supabase
      .from('user_levels')
      .select('level, xp')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || { level: 0, xp: 0 };
  } catch (error) {
    console.error('Error getting user level:', error);
    return { level: 0, xp: 0 };
  }
}

async function updateUserXP(guildId, userId, xpGained) {
  try {
    const userData = await getUserLevel(guildId, userId);
    const newXP = userData.xp + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)); // XP formula
    
    await supabase
      .from('user_levels')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        level: newLevel,
        xp: newXP,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'guild_id,user_id'
      });

    return { 
      oldLevel: userData.level, 
      newLevel, 
      xpGained,
      totalXP: newXP 
    };
  } catch (error) {
    console.error('Error updating user XP:', error);
    return null;
  }
}

async function getLevelRewards(guildId) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .select('*')
      .eq('guild_id', guildId)
      .order('level', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting level rewards:', error);
    return [];
  }
}

async function handleMilestoneRoles(guild, member, newLevel, oldLevel) {
  try {
    const rewards = await getLevelRewards(guild.id);
    if (rewards.length === 0) return;

    // Find current milestone (highest level reward user qualifies for)
    const currentMilestone = rewards
      .filter(reward => reward.level <= newLevel)
      .sort((a, b) => b.level - a.level)[0];

    // Find previous milestone
    const previousMilestone = rewards
      .filter(reward => reward.level <= oldLevel)
      .sort((a, b) => b.level - a.level)[0];

    // Remove old milestone role if different from current
    if (previousMilestone && (!currentMilestone || previousMilestone.role_id !== currentMilestone?.role_id)) {
      try {
        const oldRole = guild.roles.cache.get(previousMilestone.role_id);
        if (oldRole && member.roles.cache.has(oldRole.id)) {
          await member.roles.remove(oldRole);
          console.log(`🔄 Removed old milestone role ${oldRole.name} from ${member.user.tag}`);
        }
      } catch (error) {
        console.error('Error removing old milestone role:', error);
      }
    }

    // Add new milestone role
    if (currentMilestone) {
      try {
        const newRole = guild.roles.cache.get(currentMilestone.role_id);
        if (newRole && !member.roles.cache.has(newRole.id)) {
          await member.roles.add(newRole);
          console.log(`🎉 Added milestone role ${newRole.name} to ${member.user.tag} for level ${newLevel}`);
          
          return newRole; // Return role for level-up message
        }
      } catch (error) {
        console.error('Error adding new milestone role:', error);
      }
    }

    return null;
  } catch (error) {
    console.error('Error handling milestone roles:', error);
    return null;
  }
}

async function sendLevelUpMessage(channel, member, oldLevel, newLevel, milestoneRole = null) {
  try {
    if (!channel || !channel.permissionsFor(channel.guild.members.me)?.has('SendMessages')) {
      return;
    }

    let message = `🎉 **Level Up!** ${member} reached **Level ${newLevel}**!`;
    
    if (milestoneRole) {
      message += `\n🏆 **Milestone Reward:** ${milestoneRole} role unlocked!`;
    }

    // Add progress info using levelService
    const nextMilestone = levelService.getNextMilestone(newLevel);
    if (nextMilestone) {
      message += `\n📈 Next milestone: **Level ${nextMilestone}**`;
    }

    await channel.send(message);
  } catch (error) {
    console.error('Error sending level up message:', error);
  }
}

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

// Handle messages for XP gain
client.on('messageCreate', async (message) => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;

  // XP cooldown check (prevent spam) - 5 seconds cooldown
  const cooldownKey = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();
  const cooldownAmount = 5 * 1000; // 5 seconds

  if (client.xpCooldowns.has(cooldownKey)) {
    const expirationTime = client.xpCooldowns.get(cooldownKey) + cooldownAmount;
    if (now < expirationTime) return; // Still on cooldown
  }

  client.xpCooldowns.set(cooldownKey, now);

  // Calculate XP gain (15-25 XP per message)
  const xpGained = Math.floor(Math.random() * 11) + 15;

  try {
    // Update user XP and check for level up
    const result = await updateUserXP(message.guild.id, message.author.id, xpGained);
    
    if (result && result.newLevel > result.oldLevel) {
      console.log(`📈 ${message.author.tag} leveled up from ${result.oldLevel} to ${result.newLevel}!`);
      
      // Handle milestone roles
      const milestoneRole = await handleMilestoneRoles(
        message.guild, 
        message.member, 
        result.newLevel, 
        result.oldLevel
      );
      
      // Send level up message
      await sendLevelUpMessage(
        message.channel, 
        message.member, 
        result.oldLevel, 
        result.newLevel, 
        milestoneRole
      );
    }
  } catch (error) {
    console.error('❌ Error handling XP gain:', error);
  }

  // Clean up old cooldowns every 5 minutes
  if (Math.random() < 0.01) { // 1% chance to run cleanup
    const expiredCooldowns = [];
    for (const [key, timestamp] of client.xpCooldowns.entries()) {
      if (now - timestamp > cooldownAmount) {
        expiredCooldowns.push(key);
      }
    }
    expiredCooldowns.forEach(key => client.xpCooldowns.delete(key));
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
