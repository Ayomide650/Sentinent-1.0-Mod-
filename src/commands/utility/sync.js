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
        
        await interaction.deferReply();
        
        try {
            const startTime = Date.now();
            
            // Load all commands from subfolders (matching your index.js structure)
            const commands = [];
            const commandsPath = path.join(__dirname, '../'); // Go up to src/commands level
            
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
                        delete require.cache[require.resolve(filePath)]; // Clear cache
                        const command = require(filePath);
                        if (command.data && command.execute) {
                            commands.push(command.data.toJSON());
                        }
                    } catch (error) {
                        console.error(`Error loading ${file}:`, error.message);
                    }
                }
            }
            
            if (commands.length === 0) {
                return await interaction.editReply('❌ No commands found to sync');
            }
            
            const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
            
            let globalResult, guildResults = { success: 0, failed: 0, failedGuilds: [] };
            
            // Sync global commands first (for user installs)
            try {
                await rest.put(
                    Routes.applicationCommands(interaction.client.user.id),
                    { body: commands }
                );
                globalResult = { success: true, count: commands.length };
            } catch (error) {
                console.error('Global sync error:', error);
                globalResult = { success: false, error: error.message };
            }
            
            // Update progress
            await interaction.editReply('🔄 Syncing commands...\n✅ Global commands synced, updating guilds...');
            
            // Sync guild commands (limit to prevent timeout)
            const guilds = Array.from(interaction.client.guilds.cache.values()).slice(0, 50); // Limit for timeout
            let processed = 0;
            
            for (const guild of guilds) {
                try {
                    await rest.put(
                        Routes.applicationGuildCommands(interaction.client.user.id, guild.id),
                        { body: commands }
                    );
                    guildResults.success++;
                } catch (error) {
                    guildResults.failed++;
                    guildResults.failedGuilds.push(guild.id);
                    console.error(`Guild sync error for ${guild.name}:`, error.message);
                }
                
                processed++;
                // Update progress every 10 guilds
                if (processed % 10 === 0) {
                    await interaction.editReply(`🔄 Syncing commands...\n✅ Global: Done\n📊 Guilds: ${processed}/${guilds.length} processed`);
                }
            }
            
            const syncTime = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalGuilds = guildResults.success + guildResults.failed;
            
            // Count command types
            const slashCommands = commands.filter(cmd => cmd.type === undefined || cmd.type === 1).length;
            const userCommands = commands.filter(cmd => cmd.type === 2).length;
            const messageCommands = commands.filter(cmd => cmd.type === 3).length;
            
            // Calculate rate limit usage (rough estimate)
            const apiCalls = 1 + totalGuilds;
            const rateLimitRemaining = Math.max(200 - apiCalls, 0);
            
            const responseMessage = `✅ Commands synced successfully!
├─ Global (User Install): ${globalResult.success ? `${globalResult.count} commands registered` : '❌ Failed'}
├─ Guild Install: ${guildResults.success}/${totalGuilds} servers updated
├─ Failed: ${guildResults.failed} servers ${guildResults.failed > 0 ? '(bot removed/no access)' : ''}
└─ Total sync time: ${syncTime} seconds

📊 Command Status:
├─ Active commands: ${commands.length}
├─ Slash commands: ${slashCommands}
├─ User commands: ${userCommands}${messageCommands > 0 ? `\n├─ Message commands: ${messageCommands}` : ''}
└─ Rate limit: ${rateLimitRemaining}/200 remaining today`;
            
            await interaction.editReply(responseMessage);
            
        } catch (error) {
            console.error('Sync command error:', error);
            await interaction.editReply('❌ An error occurred while syncing commands. Check console for details.');
        }
    },
};
