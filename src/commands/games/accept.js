const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Accept a dice battle challenge'),
    
    async execute(interaction) {
        try {
            // Get guild ID for coin operations
            const guildId = interaction.guild?.id;
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            // Import activeGames from dicebattle module
            const { activeGames } = require('./dicebattle');
            
            if (!activeGames) {
                return await interaction.reply({
                    content: '❌ Dice battle system not available!',
                    ephemeral: true
                });
            }

            // Find challenge for this user (they should be the challenged player)
            const game = activeGames.get(interaction.user.id);
            
            if (!game) {
                return await interaction.reply({
                    content: '❌ No active challenge found for you!',
                    ephemeral: true
                });
            }

            // Validate that both players have enough coins
            const challengerCoins = await getUserCoins(guildId, game.challenger);
            const accepterCoins = await getUserCoins(guildId, interaction.user.id);

            if (challengerCoins < game.amount) {
                activeGames.delete(interaction.user.id);
                return await interaction.reply({
                    content: `❌ Challenge cancelled! The challenger doesn't have enough coins anymore.`,
                    ephemeral: true
                });
            }

            if (accepterCoins < game.amount) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins to accept this challenge! You need ${game.amount} coins but only have ${accepterCoins}.`,
                    ephemeral: true
                });
            }

            // Acknowledge the acceptance
            await interaction.reply({
                content: `🎲 Challenge accepted! Starting dice battle between <@${game.challenger}> and <@${interaction.user.id}> for **${game.amount}** coins!`,
                ephemeral: false
            });

            // Start dice battle game
            let p1Score = 0; // Challenger's score
            let p2Score = 0; // Accepter's score
            const roundsToWin = Math.ceil(game.rounds / 2);
            let currentRound = 1;

            // Add a small delay before starting
            await new Promise(resolve => setTimeout(resolve, 1000));

            while (currentRound <= game.rounds && p1Score < roundsToWin && p2Score < roundsToWin) {
                const p1Roll = Math.floor(Math.random() * 6) + 1;
                const p2Roll = Math.floor(Math.random() * 6) + 1;
                
                let roundResult = '';
                
                if (p1Roll > p2Roll) {
                    p1Score++;
                    roundResult = `<@${game.challenger}> wins this round!`;
                } else if (p2Roll > p1Roll) {
                    p2Score++;
                    roundResult = `<@${interaction.user.id}> wins this round!`;
                } else {
                    roundResult = `It's a tie! Rolling again...`;
                    // Don't increment round for ties
                    await interaction.followUp({
                        content: `🎲 **Round ${currentRound}**: <@${game.challenger}> rolled **${p1Roll}** | <@${interaction.user.id}> rolled **${p2Roll}** 🎲\n${roundResult}`,
                        ephemeral: false
                    });
                    
                    // Small delay between tie rounds
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    continue;
                }

                await interaction.followUp({
                    content: `🎲 **Round ${currentRound}**: <@${game.challenger}> rolled **${p1Roll}** | <@${interaction.user.id}> rolled **${p2Roll}** 🎲\n${roundResult}\n📊 **Score**: ${p1Score}-${p2Score}`,
                    ephemeral: false
                });

                currentRound++;
                
                // Add delay between rounds for better readability
                if (currentRound <= game.rounds && p1Score < roundsToWin && p2Score < roundsToWin) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            // Determine winner and loser
            const winner = p1Score > p2Score ? game.challenger : interaction.user.id;
            const loser = p1Score > p2Score ? interaction.user.id : game.challenger;
            const winnerName = p1Score > p2Score ? 'challenger' : 'accepter';

            // Update coins with guildId parameter
            await updateUserCoins(guildId, winner, game.amount);
            await updateUserCoins(guildId, loser, -game.amount);

            // Get updated balances
            const winnerNewBalance = await getUserCoins(guildId, winner);
            const loserNewBalance = await getUserCoins(guildId, loser);

            // Remove the game from active games
            activeGames.delete(interaction.user.id);

            // Announce the final result
            await interaction.followUp({
                content: `🏆 **GAME OVER!** 🏆\n\n` +
                        `🥇 <@${winner}> wins **${game.amount}** coins!\n` +
                        `📊 **Final Score**: ${p1Score}-${p2Score}\n` +
                        `💰 **New Balances**:\n` +
                        `└ <@${winner}>: ${winnerNewBalance} coins\n` +
                        `└ <@${loser}>: ${loserNewBalance} coins`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in accept command:', error);
            
            // Clean up the game if it exists
            try {
                const { activeGames } = require('./dicebattle');
                if (activeGames && activeGames.has(interaction.user.id)) {
                    activeGames.delete(interaction.user.id);
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }

            const errorMessage = '❌ An error occurred during the dice battle. The challenge has been cancelled.';
            
            try {
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
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    }
};
