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

// Usage in your Discord command
// interaction.reply(getEnvironmentStatus());
