// /src/handlers/buttonHandlers.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../utils/coinUtils');

async function handle(interaction) {
  try {
    const customId = interaction.customId;

    // Route to specific button handlers
    if (customId.startsWith('rps_bot_')) {
      await handleBotGameButton(interaction);
    }
    else if (customId.startsWith('rps_pvp_')) {
      await handlePvpGameButton(interaction);
    }
    else {
      console.log(`Unknown button interaction: ${customId}`);
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    
    try {
      const errorMessage = {
        content: 'There was an error processing your button click!',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('Failed to send button error message:', replyError);
    }
  }
}

async function handleBotGameButton(interaction) {
  try {
    // DEFER THE INTERACTION IMMEDIATELY for database operations
    await interaction.deferUpdate();

    const [, , choice, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      await interaction.followUp({
        content: '❌ This is not your game!',
        ephemeral: true
      });
      return;
    }

    const { activeBotGames } = require('../commands/games/rps-bot');
    const game = activeBotGames.get(userId);

    if (!game) {
      await interaction.followUp({
        content: '❌ Game not found or expired!',
        ephemeral: true
      });
      return;
    }

    // Bot makes random choice
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * 3)];
    
    // Determine winner
    const result = determineWinner(choice, botChoice);
    let roundResult = '';
    
    if (result === 'player1') {
      game.playerWins++;
      roundResult = '🎉 You won this round!';
    } else if (result === 'player2') {
      game.botWins++;
      roundResult = '🤖 Bot won this round!';
    } else {
      roundResult = '🤝 It\'s a tie!';
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎮 Rock Paper Scissors vs Bot')
      .setDescription(`**Round ${game.currentRound}/${game.rounds}**\n\n` +
                    `**Your choice:** ${getEmoji(choice)} ${choice}\n` +
                    `**Bot's choice:** ${getEmoji(botChoice)} ${botChoice}\n\n` +
                    `${roundResult}\n\n` +
                    `**Score:** You: ${game.playerWins} | Bot: ${game.botWins}`)
      .setTimestamp();

    // Check if game is over
    if (game.currentRound >= game.rounds) {
      // Game finished - handle final result with timeout protection
      let finalResult = '';
      let winnings = 0;
      let wonGame = false;

      if (game.playerWins > game.botWins) {
        finalResult = '🎉 **You won the game!**';
        winnings = game.totalBet * 2;
        wonGame = true;
        
        // Database operation with timeout protection
        await Promise.race([
          updateUserCoins(game.guildId, userId, winnings),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 8000)
          )
        ]);
      } else if (game.botWins > game.playerWins) {
        finalResult = '💀 **Bot won the game!**';
        winnings = 0;
      } else {
        finalResult = '🤝 **Game tied!**';
        winnings = game.totalBet;
        
        // Database operation with timeout protection
        await Promise.race([
          updateUserCoins(game.guildId, userId, winnings),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 8000)
          )
        ]);
      }

      // Get final balance with timeout protection
      const finalBalance = await Promise.race([
        getUserCoins(game.guildId, userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 8000)
        )
      ]);
      
      embed.addFields({
        name: '🏆 Final Result',
        value: `${finalResult}\n💰 **Winnings:** ${winnings} coins\n💰 **New balance:** ${finalBalance} coins`,
        inline: false
      });

      activeBotGames.delete(userId);

      // Use editReply since we deferred
      await interaction.editReply({
        embeds: [embed],
        components: []
      });

      // Send public message if won
      if (wonGame) {
        try {
          const publicMessage = `🎉 ${interaction.user} defeated the bot in Rock Paper Scissors and won **${game.totalBet}** coins! (${game.playerWins}-${game.botWins})`;
          await interaction.followUp({ 
            content: publicMessage,
            ephemeral: false 
          });
        } catch (followUpError) {
          console.error('Failed to send public message:', followUpError);
        }
      }

    } else {
      // Continue to next round
      game.currentRound++;

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

      embed.setDescription(embed.data.description + `\n\n**Round ${game.currentRound}/${game.rounds}**\nChoose your next move:`);

      // Use editReply since we deferred
      await interaction.editReply({
        embeds: [embed],
        components: [buttons]
      });
    }

  } catch (error) {
    console.error('Error in bot game button:', error);
    
    try {
      const errorMessage = {
        content: '❌ An error occurred during the game!',
        ephemeral: true
      };

      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else if (interaction.replied) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

async function handlePvpGameButton(interaction) {
  try {
    // DEFER THE INTERACTION IMMEDIATELY for database operations
    await interaction.deferUpdate();

    const [, , choice, gameId] = interaction.customId.split('_');
    
    const { activePlayerGames } = require('../commands/games/rps-accept');
    const game = activePlayerGames.get(gameId);

    if (!game) {
      await interaction.followUp({
        content: '❌ Game not found or expired!',
        ephemeral: true
      });
      return;
    }

    // Your existing PvP logic here...
    // Remember to:
    // 1. Use Promise.race for database operations
    // 2. Use interaction.editReply() instead of interaction.update()
    // 3. Proper error handling

    // Placeholder for now - implement your PvP logic following the same pattern

  } catch (error) {
    console.error('Error in PvP game button:', error);
    
    try {
      const errorMessage = {
        content: '❌ An error occurred during the PvP game!',
        ephemeral: true
      };

      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else if (interaction.replied) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

// Helper functions
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'tie';
  
  const wins = {
    'rock': 'scissors',
    'paper': 'rock',
    'scissors': 'paper'
  };
  
  return wins[choice1] === choice2 ? 'player1' : 'player2';
}

function getEmoji(choice) {
  const emojis = {
    'rock': '🪨',
    'paper': '📄',
    'scissors': '✂️'
  };
  return emojis[choice] || '❓';
}

module.exports = {
  handle,
  handleBotGameButton,
  handlePvpGameButton
};
