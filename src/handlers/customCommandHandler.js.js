// customCommandHandler.js
const fs = require('fs').promises;
const path = require('path');
const vm = require('vm');
const { EmbedBuilder } = require('discord.js');

const COMMANDS_FILE = path.join(__dirname, 'data', 'customCommands.json');

// Load custom commands from file
const loadCommands = async (guildId) => {
  try {
    const data = await fs.readFile(COMMANDS_FILE, 'utf8');
    const allCommands = JSON.parse(data);
    return allCommands[guildId] || {};
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

// Save custom commands to file
const saveCommands = async (guildId, commands) => {
  try {
    let allCommands = {};
    
    try {
      const data = await fs.readFile(COMMANDS_FILE, 'utf8');
      allCommands = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    allCommands[guildId] = commands;
    await fs.writeFile(COMMANDS_FILE, JSON.stringify(allCommands, null, 2));
  } catch (error) {
    throw error;
  }
};

// Execute JavaScript code safely with Discord context
const executeCode = (code, discordContext = {}) => {
  try {
    // Create a safe context with limited access
    const safeContext = {
      // Math functions
      Math: Math,
      // Date functions  
      Date: Date,
      // String methods
      String: String,
      Number: Number,
      // Array methods
      Array: Array,
      // JSON methods
      JSON: JSON,
      // Discord context
      user: discordContext.user || {},
      guild: discordContext.guild || {},
      channel: discordContext.channel || {},
      message: discordContext.message || {},
      args: discordContext.args || [],
      // Utility functions
      random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
      // Console for debugging
      console: {
        log: (...args) => args.join(' ')
      }
    };

    // Create VM context
    const vmContext = vm.createContext(safeContext);
    
    // Execute code with timeout
    const result = vm.runInContext(code, vmContext, {
      timeout: 2000, // 2 second timeout
      displayErrors: false
    });

    return { success: true, result: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Process mixed content (text with embedded code)
const processMixedContent = (content, context) => {
  // Replace {{code}} blocks with executed results
  return content.replace(/\{\{([\s\S]*?)\}\}/g, (match, code) => {
    const result = executeCode(code.trim(), context);
    if (result.success) {
      return String(result.result);
    } else {
      return `[Error: ${result.error}]`;
    }
  });
};

// Handle custom command execution
const handleCustomCommand = async (message) => {
  // Skip if message doesn't start with prefix or is from a bot
  if (!message.content.startsWith('!') || message.author.bot) {
    return false;
  }

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  try {
    const commands = await loadCommands(message.guild.id);
    
    if (commands[commandName]) {
      const command = commands[commandName];
      
      // Increment usage counter
      command.uses++;
      await saveCommands(message.guild.id, commands);

      // Create Discord context for code execution
      const discordContext = {
        user: {
          id: message.author.id,
          username: message.author.username,
          displayName: message.author.displayName,
          tag: message.author.tag
        },
        guild: {
          id: message.guild.id,
          name: message.guild.name,
          memberCount: message.guild.memberCount
        },
        channel: {
          id: message.channel.id,
          name: message.channel.name,
          type: message.channel.type
        },
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt
        },
        args: args
      };

      let response;

      // Handle different command types
      switch (command.type) {
        case 'code':
          const codeResult = executeCode(command.response, discordContext);
          if (codeResult.success) {
            response = String(codeResult.result);
          } else {
            response = `❌ Error executing command: ${codeResult.error}`;
          }
          break;

        case 'mixed':
          response = processMixedContent(command.response, discordContext);
          break;

        case 'text':
        default:
          response = command.response;
          break;
      }

      // Send the response
      if (response) {
        // If response is too long, send as embed
        if (response.length > 2000) {
          const embed = new EmbedBuilder()
            .setTitle(`Command: ${commandName}`)
            .setDescription(response.substring(0, 4000))
            .setColor(0x0099ff)
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        } else {
          await message.reply(response);
        }
      }

      return true; // Command was handled
    }
  } catch (error) {
    console.error('Error handling custom command:', error);
    await message.reply('❌ An error occurred while executing this custom command.');
  }

  return false; // Command not found or error occurred
};

module.exports = { handleCustomCommand, executeCode };

// Example integration in your main bot file:
/*
const { handleCustomCommand } = require('./customCommandHandler');

client.on('messageCreate', async (message) => {
  // Try to handle as custom command first
  const wasCustomCommand = await handleCustomCommand(message);
  
  if (!wasCustomCommand) {
    // Handle other message events or commands here
    // Your existing message handling logic
  }
});
*/
