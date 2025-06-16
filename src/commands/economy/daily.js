const { SlashCommandBuilder } = require('discord.js');
const { claimDailyCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins'),
    
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            console.log("guildId:", guildId);
            console.log("userId:", userId);
            
            // Use the new claimDailyCoins function with 500 coins and 4 AM WAT reset
            const result = await claimDailyCoins(guildId, userId, 500);
            
            if (result.success) {
                await interaction.reply({
                    content: `🎉 You've claimed your daily 500 coins!\n💰 Your balance is now: ${result.newBalance.toLocaleString()} coins`,
                    ephemeral: true
                });
            } else if (result.alreadyClaimed) {
                await interaction.reply({
                    content: `❌ You've already claimed your daily coins!\n⏰ Try again after 4:00 AM WAT.`,
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
            await interaction.reply({
                content: '❌ Error claiming daily coins! Please try again.',
                ephemeral: true
            });
        }
    }
};
