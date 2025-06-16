const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin to win or lose coins')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to bet (minimum 1)')
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Choose heads or tails')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
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
            const choice = interaction.options.getString('choice');
            const userId = interaction.user.id;

            // Input validation
            if (amount <= 0) {
                return await interaction.reply({ 
                    content: '❌ Bet amount must be greater than 0!',
                    ephemeral: true 
                });
            }

            // Get user's current coins
            console.log("guildId:", interaction.guild?.id);
            console.log("userId:", userId);
            const userCoins = await getUserCoins(userId);
            
            if (userCoins < amount) {
                return await interaction.reply({ 
                    content: `❌ You don't have enough coins! You have ${userCoins} coins but tried to bet ${amount}.`,
                    ephemeral: true 
                });
            }

            // Perform the coin flip
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = choice === result;
            
            // Calculate coin change
            const changeAmount = won ? amount : -amount;
            
            // Update user's coins
            await updateUserCoins(userId, changeAmount);
            
            // Get updated coin balance
            console.log("guildId:", interaction.guild?.id);
            console.log("userId:", userId);
            const newBalance = await getUserCoins(userId);

            // Create result message
            const resultEmoji = result === 'heads' ? '🪙' : '🎯';
            const outcomeEmoji = won ? '🎉' : '💸';
            
            const resultMessage = `${resultEmoji} The coin landed on **${result.toUpperCase()}**!\n` +
                `${outcomeEmoji} You ${won ? 'won' : 'lost'} **${Math.abs(changeAmount)}** coins!\n` +
                `💰 Your new balance: **${newBalance}** coins`;

            // Reply to the user
            await interaction.reply({ 
                content: resultMessage,
                ephemeral: true 
            });

            // Send public message
            const publicMessage = `🎲 ${interaction.user} flipped a coin and ${won ? 'won' : 'lost'} **${Math.abs(changeAmount)}** coins! (${result.toUpperCase()})`;
            
            await interaction.followUp({ 
                content: publicMessage,
                ephemeral: false 
            });

        } catch (error) {
            console.error('Error in coinflip command:', error);
            
            // Handle the error gracefully
            const errorMessage = '❌ An error occurred while processing your coinflip. Please try again later.';
            
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
