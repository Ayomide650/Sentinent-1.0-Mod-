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
        
        await interaction.reply('🔄 Syncing commands...');
        
        try {
            const startTime = Date.now();
            
            // Load all commands
            const commands = [];
            const commandsPath = path.join(__dirname, '../commands'); // Adjust path as needed
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
            
            const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
            
            let globalResult, guildResults = { success: 0, failed: 0, failedGuilds: [] };
            
            // Sync global commands (for user installs)
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
            
            // Sync guild commands
            const guilds = interaction.client.guilds.cache;
            for (const [guildId, guild] of guilds) {
                try {
                    await rest.put(
                        Routes.applicationGuildCommands(interaction.client.user.id, guildId),
                        { body: commands }
                    );
                    guildResults.success++;
                } catch (error) {
                    guildResults.failed++;
                    guildResults.failedGuilds.push(guildId);
                    console.error(`Guild sync error for ${guild.name} (${guildId}):`, error.message);
                }
            }
            
            const syncTime = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalGuilds = guildResults.success + guildResults.failed;
            
            // Count command types
            const slashCommands = commands.filter(cmd => cmd.type === undefined || cmd.type === 1).length;
            const userCommands = commands.filter(cmd => cmd.type === 2).length;
            const messageCommands = commands.filter(cmd => cmd.type === 3).length;
            
            // Calculate rate limit usage (rough estimate)
            const apiCalls = 1 + totalGuilds; // 1 global + guild calls
            const rateLimitUsed = Math.min(apiCalls, 200);
            const rateLimitRemaining = 200 - rateLimitUsed;
            
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
