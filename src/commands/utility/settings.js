const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Filter to only show your custom environment variables
const customEnvVars = [
    'ADMIN_USER_IDS',
    'BAN_LOG_CHANNEL',
    'CLIENT_ID',
    'DISCORD_TOKEN',
    'SUPABASE_KEY',
    'SUPABASE_URL',
    'WARN_LOG_CHANNEL'
];

function getEnvironmentStatus() {
    let envStatus = '```\n🔧 CUSTOM ENVIRONMENT VARIABLES\n════════════════════════════════════════\n\n';
    
    customEnvVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            // Mask sensitive values (show only first few and last few characters)
            let displayValue = value;
            if (varName === 'DISCORD_TOKEN' || varName === 'SUPABASE_KEY') {
                const start = value.substring(0, 4);
                const end = value.substring(value.length - 4);
                const masked = '*'.repeat(Math.min(value.length - 8, 50));
                displayValue = `${start}${masked}${end}`;
            } else if (varName === 'SUPABASE_URL') {
                displayValue = value.replace(/\/\/.*\.supabase\.co/, '//*****');
            }
            
            envStatus += `✅ ${varName.padEnd(18)} : ${displayValue}\n`;
        } else {
            envStatus += `❌ ${varName.padEnd(18)} : NOT SET\n`;
        }
    });
    
    const setCount = customEnvVars.filter(varName => process.env[varName]).length;
    envStatus += `\nTotal: ${setCount}/${customEnvVars.length} custom variables set\`\`\``;
    
    return envStatus;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Display bot configuration and environment status')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Check if user is an admin
            const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
            if (!adminIds.includes(interaction.user.id)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to use this command.',
                    ephemeral: true
                });
            }

            const envStatus = getEnvironmentStatus();
            
            // Create an embed for better formatting
            const embed = new EmbedBuilder()
                .setTitle('🔧 Bot Settings & Configuration')
                .setDescription(envStatus)
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true // Only visible to the user who ran the command
            });

        } catch (error) {
            console.error('Error in settings command:', error);
            await interaction.reply({
                content: '❌ An error occurred while retrieving settings.',
                ephemeral: true
            });
        }
    }
};
