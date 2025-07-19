const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const vm = require('vm');

// Path to store custom commands
const COMMANDS_FILE = path.join(__dirname, '..', 'data', 'customCommands.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dir = path.dirname(COMMANDS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Load custom commands from file
const loadCommands = async (guildId) => {
  try {
    await ensureDataDir();
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
    await ensureDataDir();
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

// Execute JavaScript code safely
const executeCode = (code, context = {}) => {
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
      // User provided context
      ...context,
      // Console for debugging (optional)
      console: {
        log: (...args) => args.join(' ')
      }
    };

    // Create VM context
    const vmContext = vm.createContext(safeContext);
    
    // Execute code with timeout
    const result = vm.runInContext(code, vmContext, {
      timeout: 1000, // 1 second timeout
      displayErrors: false
    });

    return { success: true, result: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customcmd')
    .setDescription('Manage custom server commands')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a custom command')
        .addStringOption(opt => 
          opt.setName('name')
            .setDescription('Command name (letters, numbers, and underscores only)')
            .setRequired(true)
            .setMaxLength(32)
        )
        .addStringOption(opt => 
          opt.setName('response')
            .setDescription('Command response (supports {{code}} for JavaScript execution)')
            .setRequired(true)
            .setMaxLength(2000)
        )
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Command type')
            .setRequired(false)
            .addChoices(
              { name: 'Text Response', value: 'text' },
              { name: 'JavaScript Code', value: 'code' },
              { name: 'Mixed (Text + Code)', value: 'mixed' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a custom command')
        .addStringOption(opt => 
          opt.setName('name')
            .setDescription('Command name to delete')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all custom commands')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Get information about a custom command')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Command name')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Test a custom command before creating it')
        .addStringOption(opt =>
          opt.setName('code')
            .setDescription('JavaScript code to test')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      if (sub === 'create') {
        const name = interaction.options.getString('name').toLowerCase().trim();
        const response = interaction.options.getString('response').trim();
        const type = interaction.options.getString('type') || 'text';

        // Validate command name
        if (!/^[a-zA-Z0-9_]+$/.test(name)) {
          return await interaction.reply({
            content: '❌ Command name can only contain letters, numbers, and underscores.',
            ephemeral: true
          });
        }

        // Check for reserved names
        const reservedNames = ['help', 'ping', 'customcmd', 'ban', 'kick', 'mute'];
        if (reservedNames.includes(name)) {
          return await interaction.reply({
            content: '❌ This command name is reserved and cannot be used.',
            ephemeral: true
          });
        }

        const commands = await loadCommands(guildId);

        // Check if command already exists
        if (commands[name]) {
          return await interaction.reply({
            content: `❌ A custom command with the name \`${name}\` already exists. Use \`/customcmd delete\` to remove it first.`,
            ephemeral: true
          });
        }

        // Check command limit
        if (Object.keys(commands).length >= 50) {
          return await interaction.reply({
            content: '❌ Maximum number of custom commands (50) reached for this server.',
            ephemeral: true
          });
        }

        // Validate code if type is code or mixed
        if (type === 'code' || type === 'mixed') {
          const codeTest = executeCode(response);
          if (!codeTest.success) {
            return await interaction.reply({
              content: `❌ JavaScript syntax error: \`${codeTest.error}\``,
              ephemeral: true
            });
          }
        }

        // Create the command
        commands[name] = {
          response: response,
          type: type,
          createdBy: interaction.user.id,
          createdAt: new Date().toISOString(),
          uses: 0
        };

        await saveCommands(guildId, commands);

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Custom Command Created')
          .setDescription(`Command \`${name}\` has been created successfully!`)
          .addFields(
            { name: 'Command Name', value: `\`${name}\``, inline: true },
            { name: 'Type', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
            { name: 'Response Preview', value: response.length > 200 ? response.substring(0, 200) + '...' : response, inline: false },
            { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setFooter({ text: 'Use the command with your server prefix (e.g., !commandname)' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (sub === 'test') {
        const code = interaction.options.getString('code');
        
        const result = executeCode(code);
        
        const embed = new EmbedBuilder()
          .setTitle('🧪 Code Test Result')
          .addFields(
            { name: 'Input Code', value: `\`\`\`javascript\n${code.substring(0, 500)}\`\`\``, inline: false }
          )
          .setTimestamp();

        if (result.success) {
          embed.setColor(0x00ff00);
          embed.addFields(
            { name: '✅ Result', value: `\`\`\`\n${String(result.result).substring(0, 1000)}\`\`\``, inline: false }
          );
        } else {
          embed.setColor(0xff0000);
          embed.addFields(
            { name: '❌ Error', value: `\`\`\`\n${result.error}\`\`\``, inline: false }
          );
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (sub === 'delete') {
        const name = interaction.options.getString('name').toLowerCase().trim();
        const commands = await loadCommands(guildId);

        if (!commands[name]) {
          return await interaction.reply({
            content: `❌ No custom command found with the name \`${name}\`.`,
            ephemeral: true
          });
        }

        delete commands[name];
        await saveCommands(guildId, commands);

        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('🗑️ Custom Command Deleted')
          .setDescription(`Command \`${name}\` has been deleted successfully!`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (sub === 'list') {
        const commands = await loadCommands(guildId);
        const commandList = Object.keys(commands);

        if (commandList.length === 0) {
          return await interaction.reply({
            content: '📝 No custom commands have been created for this server yet.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`📋 Custom Commands (${commandList.length})`)
          .setDescription(
            commandList.length <= 25 
              ? commandList.map(cmd => `• \`${cmd}\` [${commands[cmd].type}] (${commands[cmd].uses} uses)`).join('\n')
              : commandList.slice(0, 25).map(cmd => `• \`${cmd}\` [${commands[cmd].type}] (${commands[cmd].uses} uses)`).join('\n') + `\n... and ${commandList.length - 25} more`
          )
          .setFooter({ text: 'Types: text, code, mixed • Use /customcmd info <name> for details' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (sub === 'info') {
        const name = interaction.options.getString('name').toLowerCase().trim();
        const commands = await loadCommands(guildId);

        if (!commands[name]) {
          return await interaction.reply({
            content: `❌ No custom command found with the name \`${name}\`.`,
            ephemeral: true
          });
        }

        const cmd = commands[name];
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`ℹ️ Command Info: \`${name}\``)
          .addFields(
            { name: 'Type', value: cmd.type.charAt(0).toUpperCase() + cmd.type.slice(1), inline: true },
            { name: 'Uses', value: cmd.uses.toString(), inline: true },
            { name: 'Created By', value: `<@${cmd.createdBy}>`, inline: true },
            { name: 'Content', value: cmd.response.length > 1000 ? cmd.response.substring(0, 1000) + '...' : cmd.response, inline: false },
            { name: 'Created At', value: new Date(cmd.createdAt).toLocaleString(), inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in customcmd command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request. Please try again later.',
        ephemeral: true
      });
    }
  }
};
