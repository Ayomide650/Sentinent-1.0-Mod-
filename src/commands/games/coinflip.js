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
            // IMMEDIATELY defer the interaction to prevent timeout
            await interaction.deferReply({ ephemeral: true });

            // Channel restriction check
            if (interaction.channel?.name !== 'game-channel') {
                await interaction.editReply({ 
                    content: '🚫 This command can only be used in the #game-channel!'
                });
                return;
            }

            const amount = interaction.options.getInteger('amount');
            const choice = interaction.options.getString('choice');
            const userId = interaction.user.id;
            const guildId = interaction.guild?.id;

            // Input validation
            if (amount <= 0) {
                await interaction.editReply({ 
                    content: '❌ Bet amount must be greater than 0!'
                });
                return;
            }

            // Get user's current coins with timeout protection
            console.log("Fetching coins for guildId:", guildId, "userId:", userId);
            
            const userCoins = await Promise.race([
                getUserCoins(guildId, userId),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout')), 10000)
                )
            ]);
            
            if (userCoins < amount) {
                await interaction.editReply({ 
                    content: `❌ You don't have enough coins! You have ${userCoins} coins but tried to bet ${amount}.`
                });
                return;
            }

            // Perform the coin flip
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = choice === result;
            
            // Calculate coin change
            const changeAmount = won ? amount : -amount;
            
            // Update user's coins with timeout protection
            await Promise.race([
                updateUserCoins(guildId, userId, changeAmount),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout')), 10000)
                )
            ]);
            
            // Get updated coin balance with timeout protection
            const newBalance = await Promise.race([
                getUserCoins(guildId, userId),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout')), 10000)
                )
            ]);

            // Create result message
            const resultEmoji = result === 'heads' ? '🪙' : '🎯';
            const outcomeEmoji = won ? '🎉' : '💸';
            
            const resultMessage = `${resultEmoji} The coin landed on **${result.toUpperCase()}**!\n` +
                `${outcomeEmoji} You ${won ? 'won' : 'lost'} **${Math.abs(changeAmount)}** coins!\n` +
                `💰 Your new balance: **${newBalance}** coins`;

            // Edit the deferred reply
            await interaction.editReply({ 
                content: resultMessage
            });

            // Send public message
            const publicMessage = `🎲 ${interaction.user} flipped a coin and ${won ? 'won' : 'lost'} **${Math.abs(changeAmount)}** coins! (${result.toUpperCase()})`;
            
            await interaction.followUp({ 
                content: publicMessage,
                ephemeral: false 
            });

        } catch (error) {
            console.error('Error in coinflip command:', error);
            
            // Safe error handling - only try to respond if we can
            try {
                const errorMessage = '❌ An error occurred while processing your coinflip. Please try again later.';
                
                if (interaction.deferred) {
                    // If we deferred, edit the reply
                    await interaction.editReply({ content: errorMessage });
                } else if (!interaction.replied) {
                    // If we haven't replied yet, reply normally
                    await interaction.reply({ 
                        content: errorMessage, 
                        ephemeral: true 
                    });
                }
                // If interaction is already replied to, do nothing (don't cause more errors)
            } catch (errorHandlingError) {
                // If even error handling fails, just log it
                console.error('Failed to send error message:', errorHandlingError);
            }
        }
    }
};
