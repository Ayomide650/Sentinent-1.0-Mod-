const { SlashCommandBuilder } = require('discord.js');

// Try different import methods to handle potential export issues
let claimDailyCoins;
try {
    // Method 1: Destructured import
    ({ claimDailyCoins } = require('../../utils/coinUtils'));
} catch (error) {
    try {
        // Method 2: Default import
        const coinUtils = require('../../utils/coinUtils');
        claimDailyCoins = coinUtils.claimDailyCoins || coinUtils.default?.claimDailyCoins;
    } catch (err) {
        console.error('Failed to import claimDailyCoins:', err);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins'),
    
    async execute(interaction) {
        try {
            // Check if the function was imported successfully
            if (!claimDailyCoins || typeof claimDailyCoins !== 'function') {
                console.error('claimDailyCoins function not available');
                return await interaction.reply({
                    content: '❌ Daily coins system is currently unavailable. Please contact an administrator.',
                    ephemeral: true
                });
            }

            const userId = interaction.user.id;
            const guildId = interaction.guild?.id;
            
            // Validate required data
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server.',
                    ephemeral: true
                });
            }
            
            console.log("guildId:", guildId);
            console.log("userId:", userId);
            
            // Use the claimDailyCoins function with 500 coins and 4 AM WAT reset
            const result = await claimDailyCoins(guildId, userId, 500);
            
            if (result.success) {
                await interaction.reply({
                    content: `🎉 You've claimed your daily 500 coins!\n💰 Your balance is now: ${result.newBalance.toLocaleString()} coins`,
                    ephemeral: true
                });
            } else if (result.alreadyClaimed) {
                // Calculate time until next claim (4 AM WAT)
                const now = new Date();
                const watTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Lagos"}));
                const tomorrow4AM = new Date(watTime);
                tomorrow4AM.setHours(4, 0, 0, 0);
                
                // If it's past 4 AM today, set it to tomorrow 4 AM
                if (watTime.getHours() >= 4) {
                    tomorrow4AM.setDate(tomorrow4AM.getDate() + 1);
                }
                
                const timeUntilReset = Math.floor(tomorrow4AM.getTime() / 1000);
                
                await interaction.reply({
                    content: `❌ You've already claimed your daily coins!\n⏰ Next claim available: <t:${timeUntilReset}:R>`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Something went wrong while claiming your daily coins. Please try again!',
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('Error in daily command:', error);
            
            // More detailed error logging
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            // Handle different types of errors
            let errorMessage = '❌ Error claiming daily coins! Please try again.';
            
            if (error.message.includes('database') || error.message.includes('connection')) {
                errorMessage = '❌ Database connection issue. Please try again in a moment.';
            } else if (error.message.includes('permission')) {
                errorMessage = '❌ Permission error. Please contact an administrator.';
            }
            
            // Ensure we can still reply
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        }
    }
};
