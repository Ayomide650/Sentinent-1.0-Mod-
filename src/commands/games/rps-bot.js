const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

// Store active bot games
const activeBotGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps-bot')
        .setDescription('Play Rock Paper Scissors against the bot')
        .addIntegerOption(option =>
            option.setName('rounds')
                .setDescription('Number of rounds to play (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Coins to bet per round')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000)),
    
    async execute(interaction) {
        try {
            const guildId = interaction.guild?.id;
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            const rounds = interaction.options.getInteger('rounds');
            const betAmount = interaction.options.getInteger('bet');
            const userId = interaction.user.id;

            // Check if user already has an active bot game
            if (activeBotGames.has(userId)) {
                return await interaction.reply({
                    content: '❌ You already have an active game with the bot!',
                    ephemeral: true
                });
            }

            // Check if user has enough coins
            const userCoins = await getUserCoins(guildId, userId);
            const totalBet = betAmount * rounds;
            
            if (userCoins < totalBet) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins! You need **${totalBet}** coins (${betAmount} per round × ${rounds} rounds) but only have **${userCoins}** coins.`,
                    ephemeral: true
                });
            }

            // Create game data
            const gameData = {
                userId,
                guildId,
                rounds,
                betAmount,
                totalBet,
                currentRound: 1,
                playerWins: 0,
                botWins: 0,
                gameStarted: Date.now()
            };

            // Store game
            activeBotGames.set(userId, gameData);

            // Deduct total bet upfront
            await updateUserCoins(guildId, userId, -totalBet);

            // Create buttons for first round
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`rps_bot_rock_${userId}`)
                        .setLabel('🪨 Rock')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`rps_bot_paper_${userId}`)
                        .setLabel('📄 Paper')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`rps_bot_scissors_${userId}`)
                        .setLabel('✂️ Scissors')
                        .setStyle(ButtonStyle.Primary)
                );

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎮 Rock Paper Scissors vs Bot')
                .setDescription(`**Round ${gameData.currentRound}/${rounds}**\n` +
                              `**Bet per round:** ${betAmount} coins\n` +
                              `**Total bet:** ${totalBet} coins\n\n` +
                              `**Score:** You: ${gameData.playerWins} | Bot: ${gameData.botWins}\n\n` +
                              `Choose your move:`)
                .setFooter({ text: 'Game expires in 60 seconds' });

            await interaction.reply({
                embeds: [embed],
                components: [buttons],
                ephemeral: true
            });

            // Set timeout for game expiry
            setTimeout(() => {
                if (activeBotGames.has(userId)) {
                    activeBotGames.delete(userId);
                    // Refund remaining rounds
                    const remainingRounds = rounds - (gameData.currentRound - 1);
                    if (remainingRounds > 0) {
                        updateUserCoins(guildId, userId, remainingRounds * betAmount);
                    }
                }
            }, 60000);

        } catch (error) {
            console.error('Error in rps-bot command:', error);
            
            // Clean up and refund if error occurs
            if (activeBotGames.has(interaction.user.id)) {
                const game = activeBotGames.get(interaction.user.id);
                activeBotGames.delete(interaction.user.id);
                if (game) {
                    await updateUserCoins(guildId, interaction.user.id, game.totalBet);
                }
            }

            await interaction.reply({
                content: '❌ An error occurred while starting the game. Any coins have been refunded.',
                ephemeral: true
            });
        }
    },

    // Export the game map for button interactions
    activeBotGames
};
