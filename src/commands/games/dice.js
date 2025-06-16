const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Play dice with multipliers')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (minimum 1)')
                .setRequired(true)
                .setMinValue(1)
        )
        .addIntegerOption(option =>
            option.setName('number1')
                .setDescription('First number (1-6)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)
        )
        .addIntegerOption(option =>
            option.setName('number2')
                .setDescription('Second number (1-6)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)
        )
        .addStringOption(option =>
            option.setName('multipliers')
                .setDescription('Choose multiplier combination')
                .setRequired(true)
                .addChoices(
                    { name: '3x and 2x (Higher risk, higher reward)', value: '3_2' },
                    { name: '4x and 1x (Extreme risk, extreme reward)', value: '4_1' }
                )
        ),
    
    async execute(interaction) {
        try {
            // Channel restriction check
            if (interaction.channel?.name !== 'game-channel') {
                return await interaction.reply({
                    content: '🚫 This command can only be used in the #game-channel!',
                    ephemeral: true
                });
            }

            const amount = interaction.options.getInteger('amount');
            const number1 = interaction.options.getInteger('number1');
            const number2 = interaction.options.getInteger('number2');
            const multiplierChoice = interaction.options.getString('multipliers');
            const userId = interaction.user.id;
            const guildId = interaction.guild.id; // Added guildId

            // Input validation
            if (amount <= 0) {
                return await interaction.reply({
                    content: '❌ Bet amount must be greater than 0!',
                    ephemeral: true
                });
            }

            if (number1 === number2) {
                return await interaction.reply({
                    content: '❌ You must choose two different numbers!',
                    ephemeral: true
                });
            }

            // Check user's coins - now passing guildId and userId
            console.log("guildId:", interaction.guild?.id);
            console.log("userId:", userId);
            const userCoins = await getUserCoins(guildId, userId);
            if (userCoins < amount) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins! You have ${userCoins} coins but tried to bet ${amount}.`,
                    ephemeral: true
                });
            }

            // Roll the dice
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            
            // Determine multiplier and outcome
            let multiplier = 0;
            let matchedNumber = null;
            
            if (diceRoll === number1) {
                multiplier = multiplierChoice === '3_2' ? 3 : 4;
                matchedNumber = number1;
            } else if (diceRoll === number2) {
                multiplier = multiplierChoice === '3_2' ? 2 : 1;
                matchedNumber = number2;
            }

            // Calculate winnings
            const won = multiplier > 0;
            const coinChange = won ? (amount * multiplier) - amount : -amount;
            
            // Update user's coins - now passing guildId, userId, and coinChange
            await updateUserCoins(guildId, userId, coinChange);
            
            // Get updated balance - now passing guildId and userId
            console.log("guildId:", interaction.guild?.id);
            console.log("userId:", userId);
            const newBalance = await getUserCoins(guildId, userId);

            // Create result message
            const diceEmoji = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceRoll];
            const outcomeEmoji = won ? '🎉' : '💸';
            
            let resultMessage = `🎲 **Dice Result**: ${diceEmoji} **${diceRoll}**\n\n`;
            
            if (won) {
                resultMessage += `${outcomeEmoji} **WINNER!** You matched number **${matchedNumber}** with **${multiplier}x** multiplier!\n`;
                resultMessage += `💰 You won **${Math.abs(coinChange)}** coins!\n`;
            } else {
                resultMessage += `${outcomeEmoji} **No match!** The dice didn't land on ${number1} or ${number2}.\n`;
                resultMessage += `💸 You lost **${Math.abs(coinChange)}** coins.\n`;
            }
            
            resultMessage += `🏦 Your new balance: **${newBalance}** coins`;

            // Reply to user
            await interaction.reply({
                content: resultMessage,
                ephemeral: true
            });

            // Public announcement
            const publicMessage = `🎲 ${interaction.user} rolled a **${diceRoll}** and ${won ? 'won' : 'lost'} **${Math.abs(coinChange)}** coins!`;
            
            await interaction.followUp({
                content: publicMessage,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in dice command:', error);
            
            const errorMessage = '❌ An error occurred while processing your dice roll. Please try again later.';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: errorMessage, 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: errorMessage, 
                    ephemeral: true 
                });
            }
        }
    }
};
