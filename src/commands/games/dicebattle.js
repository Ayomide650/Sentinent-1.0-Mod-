const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

// Export activeGames so other commands can access it
const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dicebattle')
        .setDescription('Challenge someone to a dice battle')
        .addUserOption(option => 
            option.setName('opponent')
                .setDescription('User to challenge')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (minimum 1)')
                .setRequired(true)
                .setMinValue(1)
        )
        .addIntegerOption(option =>
            option.setName('rounds')
                .setDescription('Number of rounds (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10)
        ),
    
    async execute(interaction) {
        try {
            const opponent = interaction.options.getUser('opponent');
            const amount = interaction.options.getInteger('amount');
            const rounds = interaction.options.getInteger('rounds');
            const challenger = interaction.user;

            // Basic validation
            if (opponent.id === challenger.id) {
                return await interaction.reply({
                    content: '❌ You cannot challenge yourself!',
                    ephemeral: true
                });
            }

            if (opponent.bot) {
                return await interaction.reply({
                    content: '❌ You cannot challenge a bot!',
                    ephemeral: true
                });
            }

            // Check if opponent is already in a game
            if (activeGames.has(opponent.id)) {
                return await interaction.reply({
                    content: '❌ This player is already in an active game!',
                    ephemeral: true
                });
            }

            // Check if challenger is already in a game
            if (activeGames.has(challenger.id)) {
                return await interaction.reply({
                    content: '❌ You are already in an active game!',
                    ephemeral: true
                });
            }

            // Input validation
            if (amount <= 0) {
                return await interaction.reply({
                    content: '❌ Bet amount must be greater than 0!',
                    ephemeral: true
                });
            }

            // Check coins for both players
            const challengerCoins = await getUserCoins(challenger.id);
            const opponentCoins = await getUserCoins(opponent.id);

            if (challengerCoins < amount) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins! You have ${challengerCoins} coins but need ${amount}.`,
                    ephemeral: true
                });
            }

            if (opponentCoins < amount) {
                return await interaction.reply({
                    content: `❌ ${opponent.displayName} doesn't have enough coins! They have ${opponentCoins} coins but need ${amount}.`,
                    ephemeral: true
                });
            }

            // Create the game challenge
            activeGames.set(opponent.id, {
                challenger: challenger.id,
                challengerId: challenger.id,
                opponentId: opponent.id,
                amount: amount,
                rounds: rounds,
                createdAt: Date.now()
            });

            // Set up auto-expiration (5 minutes)
            setTimeout(() => {
                if (activeGames.has(opponent.id)) {
                    activeGames.delete(opponent.id);
                    interaction.followUp({
                        content: `⏰ The dice battle challenge from ${challenger} to ${opponent} has expired.`,
                        ephemeral: false
                    }).catch(console.error);
                }
            }, 5 * 60 * 1000); // 5 minutes

            // Send challenge message
            const challengeMessage = `🎲 **DICE BATTLE CHALLENGE!** 🎲\n\n` +
                `${opponent}, you have been challenged by ${challenger}!\n\n` +
                `💰 **Bet Amount**: ${amount} coins\n` +
                `🎯 **Rounds**: ${rounds}\n` +
                `⏰ **Expires**: <t:${Math.floor((Date.now() + 5 * 60 * 1000) / 1000)}:R>\n\n` +
                `Use \`/accept\` to accept or \`/reject\` to decline the challenge!`;

            await interaction.reply({
                content: challengeMessage,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in dicebattle command:', error);
            
            // Clean up any partial game state
            try {
                const opponent = interaction.options.getUser('opponent');
                if (opponent && activeGames.has(opponent.id)) {
                    activeGames.delete(opponent.id);
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }

            const errorMessage = '❌ An error occurred while creating the dice battle challenge. Please try again later.';
            
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
    },
    
    // Export activeGames for use in other commands
    activeGames
};
