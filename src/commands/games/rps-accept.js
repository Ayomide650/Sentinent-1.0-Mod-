const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

// Store active player vs player games
const activePlayerGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps-accept')
        .setDescription('Accept a Rock Paper Scissors challenge'),
    
    async execute(interaction) {
        try {
            const guildId = interaction.guild?.id;
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            // Import activeInvites from rps-challenge module
            const { activeInvites } = require('./rps-challenge');
            
            if (!activeInvites) {
                return await interaction.reply({
                    content: '❌ Rock Paper Scissors system not available!',
                    ephemeral: true
                });
            }

            // Find invite for this user
            const invite = activeInvites.get(interaction.user.id);
            
            if (!invite) {
                return await interaction.reply({
                    content: '❌ No active Rock Paper Scissors challenge found for you!',
                    ephemeral: true
                });
            }

            // Validate that both players still have enough coins
            const challengerCoins = await getUserCoins(guildId, invite.challengerId);
            const accepterCoins = await getUserCoins(guildId, interaction.user.id);

            if (challengerCoins < invite.totalBet) {
                activeInvites.delete(interaction.user.id);
                return await interaction.reply({
                    content: `❌ Challenge cancelled! The challenger doesn't have enough coins anymore.`,
                    ephemeral: true
                });
            }

            if (accepterCoins < invite.totalBet) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins to accept this challenge! You need **${invite.totalBet}** coins but only have **${accepterCoins}** coins.`,
                    ephemeral: true
                });
            }

            // Deduct coins from both players upfront
            await updateUserCoins(guildId, invite.challengerId, -invite.totalBet);
            await updateUserCoins(guildId, interaction.user.id, -invite.totalBet);

            // Create game data
            const gameId = `${invite.challengerId}_${interaction.user.id}_${Date.now()}`;
            const gameData = {
                gameId,
                challengerId: invite.challengerId,
                accepterId: interaction.user.id,
                guildId,
                channelId: interaction.channel.id,
                rounds: invite.rounds,
                betAmount: invite.betAmount,
                totalBet: invite.totalBet,
                currentRound: 1,
                challengerWins: 0,
                accepterWins: 0,
                challengerChoice: null,
                accepterChoice: null,
                gameStarted: Date.now()
            };

            // Store game
            activePlayerGames.set(gameId, gameData);

            // Remove the invite
            activeInvites.delete(interaction.user.id);

            // Acknowledge the acceptance
            await interaction.reply({
                content: `🎮 Challenge accepted! Starting Rock Paper Scissors between <@${invite.challengerId}> and <@${interaction.user.id}> for **${invite.totalBet}** coins total!`,
                ephemeral: false
            });

            // Start the first round
            await startRound(interaction, gameData);

        } catch (error) {
            console.error('Error in rps-accept command:', error);
            
            // Clean up and refund if error occurs
            try {
                const { activeInvites } = require('./rps-challenge');
                if (activeInvites && activeInvites.has(interaction.user.id)) {
                    activeInvites.delete(interaction.user.id);
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }

            await interaction.reply({
                content: '❌ An error occurred while accepting the challenge.',
                ephemeral: true
            });
        }
    },

    // Export the games map for button interactions
    activePlayerGames
};

async function startRound(interaction, gameData) {
    try {
        // Reset choices for new round
        gameData.challengerChoice = null;
        gameData.accepterChoice = null;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎮 Rock Paper Scissors')
            .setDescription(`**Round ${gameData.currentRound}/${gameData.rounds}**\n\n` +
                          `**Players:** <@${gameData.challengerId}> vs <@${gameData.accepterId}>\n` +
                          `**Score:** ${gameData.challengerWins} - ${gameData.accepterWins}\n\n` +
                          `Both players, click the buttons below to make your choice!\n` +
                          `*Your choice will be private.*`)
            .setFooter({ text: 'Round expires in 30 seconds' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`rps_pvp_rock_${gameData.gameId}`)
                    .setLabel('🪨 Rock')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`rps_pvp_paper_${gameData.gameId}`)
                    .setLabel('📄 Paper')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`rps_pvp_scissors_${gameData.gameId}`)
                    .setLabel('✂️ Scissors')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.followUp({
            embeds: [embed],
            components: [buttons],
            ephemeral: false
        });

        // Set timeout for round
        setTimeout(() => {
            if (activePlayerGames.has(gameData.gameId)) {
                const game = activePlayerGames.get(gameData.gameId);
                if (!game.challengerChoice || !game.accepterChoice) {
                    // Game expired, refund remaining rounds
                    const remainingRounds = game.rounds - (game.currentRound - 1);
                    const refundAmount = remainingRounds * game.betAmount;
                    
                    updateUserCoins(game.guildId, game.challengerId, refundAmount);
                    updateUserCoins(game.guildId, game.accepterId, refundAmount);
                    
                    activePlayerGames.delete(gameData.gameId);
                    
                    interaction.followUp({
                        content: `⏰ Round ${game.currentRound} expired! Game cancelled and remaining coins refunded.`,
                        ephemeral: false
                    }).catch(console.error);
                }
            }
        }, 30000);

    } catch (error) {
        console.error('Error starting round:', error);
    }
}
