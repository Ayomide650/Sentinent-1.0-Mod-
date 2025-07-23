const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('Sync all bot commands (Owner only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Owner check using environment variable
        const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
        
        if (!ADMIN_USER_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: '❌ This command is restricted to bot administrators only.',
                ephemeral: true
            });
        }
        
        // Defer reply immediately to prevent timeout
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const startTime = Date.now();
            
            // Load all commands from subfolders
            const commands = [];
            const commandNames = new Set(); // Track duplicate names
            const commandsPath = path.join(__dirname, '../');
            
            // Check if commands directory exists
            if (!fs.existsSync(commandsPath)) {
                return await interaction.editReply('❌ Commands directory not found');
            }
            
            const commandFolders = fs.readdirSync(commandsPath).filter(item => {
                const folderPath = path.join(commandsPath, item);
                return fs.statSync(folderPath).isDirectory();
            });
            
            // Load commands from each subfolder
            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);
                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                
                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    try {
                        // Clear require cache to get fresh command data
                        delete require.cache[require.resolve(filePath)];
                        const command = require(filePath);
                        
                        if (command.data && command.execute) {
                            const commandData = command.data.toJSON();
                            const commandName = commandData.name;
                            
                            // Check for duplicate names
                            if (commandNames.has(commandName)) {
                                console.warn(`⚠️ Duplicate command name found: ${commandName} in ${file}`);
                                continue; // Skip duplicate
                            }
                            
                            commandNames.add(commandName);
                            commands.push(commandData);
                        }
                    } catch (error) {
                        console.error(`❌ Error loading ${file}:`, error.message);
                    }
                }
            }
            
            if (commands.length === 0) {
                return await interaction.editReply('❌ No valid commands found to sync');
            }
            
            // Log command names for debugging
            console.log('Commands to sync:', commands.map(cmd => cmd.name).join(', '));
            
            const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
            
            let results = {
                global: { success: false, count: 0, error: null },
                guilds: { success: 0, failed: 0, total: 0 }
            };
            
            // Update progress
            await interaction.editReply('🔄 Starting command sync...');
            
            try {
                // Sync global commands
                await rest.put(
                    Routes.applicationCommands(interaction.client.user.id),
                    { body: commands }
                );
                results.global = { success: true, count: commands.length, error: null };
                
                await interaction.editReply('🔄 Global commands synced! Updating guild commands...');
                
            } catch (error) {
                console.error('Global sync error:', error);
                results.global.error = error.message;
                
                // Continue with guild sync even if global fails
                await interaction.editReply('⚠️ Global sync failed, attempting guild sync...');
            }
            
            // Sync guild commands (limit to prevent timeout)
            const guilds = Array.from(interaction.client.guilds.cache.values()).slice(0, 25);
            results.guilds.total = guilds.length;
            
            for (let i = 0; i < guilds.length; i++) {
                const guild = guilds[i];
                try {
                    await rest.put(
                        Routes.applicationGuildCommands(interaction.client.user.id, guild.id),
                        { body: commands }
                    );
                    results.guilds.success++;
                    
                    // Update progress every 5 guilds
                    if ((i + 1) % 5 === 0) {
                        await interaction.editReply(
                            `🔄 Syncing guild commands... ${i + 1}/${guilds.length} completed`
                        );
                    }
                    
                } catch (error) {
                    results.guilds.failed++;
                    console.error(`Guild sync error for ${guild.name}:`, error.message);
                }
                
                // Add small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Calculate sync time
            const syncTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Count command types
            const slashCommands = commands.filter(cmd => !cmd.type || cmd.type === 1).length;
            const userCommands = commands.filter(cmd => cmd.type === 2).length;
            const messageCommands = commands.filter(cmd => cmd.type === 3).length;
            
            // Build response message
            let responseMessage = `✅ Command sync completed!\n\n`;
            
            // Global sync status
            if (results.global.success) {
                responseMessage += `🌐 **Global Commands**: ✅ ${results.global.count} commands registered\n`;
            } else {
                responseMessage += `🌐 **Global Commands**: ❌ Failed - ${results.global.error}\n`;
            }
            
            // Guild sync status
            responseMessage += `🏠 **Guild Commands**: ${results.guilds.success}/${results.guilds.total} servers updated\n`;
            if (results.guilds.failed > 0) {
                responseMessage += `   └─ ${results.guilds.failed} failed (likely due to permissions)\n`;
            }
            
            responseMessage += `\n📊 **Command Breakdown**:\n`;
            responseMessage += `   ├─ Total commands: ${commands.length}\n`;
            responseMessage += `   ├─ Slash commands: ${slashCommands}\n`;
            if (userCommands > 0) responseMessage += `   ├─ User commands: ${userCommands}\n`;
            if (messageCommands > 0) responseMessage += `   ├─ Message commands: ${messageCommands}\n`;
            responseMessage += `   └─ Sync time: ${syncTime}s`;
            
            await interaction.editReply(responseMessage);
            
        } catch (error) {
            console.error('Sync command error:', error);
            
            // Handle different error scenarios
            try {
                if (error.code === 10062) {
                    // Interaction expired - log but don't try to respond
                    console.error('Interaction expired during sync operation');
                    return;
                }
                
                await interaction.editReply('❌ An error occurred during sync. Check console for details.');
            } catch (replyError) {
                console.error('Failed to send error message:', replyError.message);
            }
        }
    },
};
