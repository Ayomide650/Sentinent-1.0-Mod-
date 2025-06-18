const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../utils/coinUtils');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handle commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      if (!command) {
        console.log(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        const reply = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit() && interaction.customId === 'sendMessageModal') {
      try {
        const messageContent = interaction.fields.getTextInputValue('messageContent');
        const channelId = interaction.fields.getTextInputValue('channelId');
        const mentionEveryone = interaction.fields.getTextInputValue('mentionEveryone').toLowerCase() === 'yes';
        const channel = await interaction.guild.channels.fetch(channelId);
        if (!channel) {
          return await interaction.reply({
            content: 'Invalid channel ID!',
            ephemeral: true
          });
        }
        const finalMessage = mentionEveryone ? `@everyone\n${messageContent}` : messageContent;
        await channel.send(finalMessage);
        await interaction.reply({
          content: 'Message sent successfully!',
          ephemeral: true
        });
      } catch (error) {
        console.error('Error handling modal submission:', error);
        await interaction.reply({
          content: 'Failed to send message. Please check the channel ID and try again.',
          ephemeral: true
        });
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Handle RPS bot game buttons
      if (customId.startsWith('rps_bot_')) {
        await handleBotGameButton(interaction);
      }
      
      // Handle RPS player vs player buttons
      if (customId.startsWith('rps_pvp_')) {
        await handlePvpGameButton(interaction);
      }
    }
  }
};

async function handleBotGameButton(interaction) {
  try {
    const [, , choice, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return await interaction.reply({
        content: '❌ This is not your game!',
        ephemeral: true
      });
    }

    // Fixed import path to match your structure
    const { activeBotGames } = require('../commands/games/rps-bot');
    const game = activeBotGames.get(userId);

    if (!game) {
      return await interaction.reply({
        content: '❌ Game not found or expired!',
        ephemeral: true
      });
    }

    // Bot makes random choice
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * 3)];
    
    // Determine winner - fixed the function call
    const result = determineWinner(choice, botChoice);
    let roundResult = '';
    
    if (result === 'player') {
      game.playerWins++;
      roundResult = '🎉 You won this round!';
    } else if (result === 'bot') {
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
      // Game finished
      let finalResult = '';
      let winnings = 0;

      if (game.playerWins > game.botWins) {
        finalResult = '🎉 **You won the game!**';
        winnings = game.totalBet * 2;
        await updateUserCoins(game.guildId, userId, winnings);
      } else if (game.botWins > game.playerWins) {
        finalResult = '💀 **Bot won the game!**';
        winnings = 0;
      } else {
        finalResult = '🤝 **Game tied!**';
        winnings = game.totalBet; // Refund bet on tie
        await updateUserCoins(game.guildId, userId, winnings);
      }

      const finalBalance = await getUserCoins(game.guildId, userId);
      
      embed.addFields({
        name: '🏆 Final Result',
        value: `${finalResult}\n💰 **Winnings:** ${winnings} coins\n💰 **New balance:** ${finalBalance} coins`,
        inline: false
      });

      activeBotGames.delete(userId);

      await interaction.update({
        embeds: [embed],
        components: []
      });
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

      await interaction.update({
        embeds: [embed],
        components: [buttons]
      });
    }

  } catch (error) {
    console.error('Error in bot game button:', error);
    await interaction.reply({
      content: '❌ An error occurred!',
      ephemeral: true
    }).catch(console.error);
  }
}

async function handlePvpGameButton(interaction) {
  try {
    const [, , choice, gameId] = interaction.customId.split('_');
    
    const { activePlayerGames } = require('../commands/games/rps-accept');
    const game = activePlayerGames.get(gameId);

    if (!game) {
      return await interaction.reply({
        content: '❌ Game not found or expired!',
        ephemeral: true
      });
    }

    // Check if user is part of this game
    if (interaction.user.id !== game.challengerId && interaction.user.id !== game.accepterId) {
      return await interaction.reply({
        content: '❌ You are not part of this game!',
        ephemeral: true
      });
    }

    // Record the choice
    if (interaction.user.id === game.challengerId) {
      if (game.challengerChoice) {
        return await interaction.reply({
          content: '❌ You have already made your choice for this round!',
          ephemeral: true
        });
      }
      game.challengerChoice = choice;
    } else {
      if (game.accepterChoice) {
        return await interaction.reply({
          content: '❌ You have already made your choice for this round!',
          ephemeral: true
        });
      }
      game.accepterChoice = choice;
    }

    await interaction.reply({
      content: `✅ You chose **${choice}**! Waiting for the other player...`,
      ephemeral: true
    });

    // Check if both players have chosen
    if (game.challengerChoice && game.accepterChoice) {
      await resolveRound(interaction, game);
    }

  } catch (error) {
    console.error('Error in PvP game button:', error);
    await interaction.followUp({
      content: '❌ An error occurred!',
      ephemeral: true
    }).catch(console.error);
  }
}

async function resolveRound(interaction, game) {
  try {
    const { activePlayerGames } = require('../commands/games/rps-accept');
    
    // Determine winner
    const result = determineWinner(game.challengerChoice, game.accepterChoice);
    let roundResult = '';
    
    if (result === 'player1') {
      game.challengerWins++;
      roundResult = `🎉 <@${game.challengerId}> wins this round!`;
    } else if (result === 'player2') {
      game.accepterWins++;
      roundResult = `🎉 <@${game.accepterId}> wins this round!`;
    } else {
      roundResult = '🤝 It\'s a tie!';
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎮 Rock Paper Scissors - Round Result')
      .setDescription(`**Round ${game.currentRound}/${game.rounds}**\n\n` +
                    `<@${game.challengerId}> chose: ${getEmoji(game.challengerChoice)} ${game.challengerChoice}\n` +
                    `<@${game.accepterId}> chose: ${getEmoji(game.accepterChoice)} ${game.accepterChoice}\n\n` +
                    `${roundResult}\n\n` +
                    `**Score:** ${game.challengerWins} - ${game.accepterWins}`)
      .setTimestamp();

    // Check if game is over
    if (game.currentRound >= game.rounds) {
      // Game finished
      let winner, loser;
      if (game.challengerWins > game.accepterWins) {
        winner = game.challengerId;
        loser = game.accepterId;
      } else if (game.accepterWins > game.challengerWins) {
        winner = game.accepterId;
        loser = game.challengerId;
      } else {
        // Tie game - refund both players
        await updateUserCoins(game.guildId, game.challengerId, game.totalBet);
        await updateUserCoins(game.guildId, game.accepterId, game.totalBet);
        
        const challengerBalance = await getUserCoins(game.guildId, game.challengerId);
        const accepterBalance = await getUserCoins(game.guildId, game.accepterId);
        
        embed.addFields({
          name: '🏆 Final Result',
          value: `🤝 **It's a tie!** Both players get their coins back.\n` +
                 `<@${game.challengerId}> balance: ${challengerBalance} coins\n` +
                 `<@${game.accepterId}> balance: ${accepterBalance} coins`,
          inline: false
        });
        
        activePlayerGames.delete(game.gameId);
        
        await interaction.editReply({
          embeds: [embed],
          components: []
        });
        return;
      }
      
      // Handle winner/loser
      await updateUserCoins(game.guildId, winner, game.totalBet * 2);
      
      const winnerBalance = await getUserCoins(game.guildId, winner);
      const loserBalance = await getUserCoins(game.guildId, loser);
      
      embed.addFields({
        name: '🏆 Final Result',
        value: `🎉 **<@${winner}> wins!** +${game.totalBet} coins\n` +
               `😔 **<@${loser}> loses!** -${game.totalBet} coins\n\n` +
               `<@${winner}> balance: ${winnerBalance} coins\n` +
               `<@${loser}> balance: ${loserBalance} coins`,
        inline: false
      });

      activePlayerGames.delete(game.gameId);

      await interaction.editReply({
        embeds: [embed],
        components: []
      });
    } else {
      // Continue to next round
      game.currentRound++;
      game.challengerChoice = null;
      game.accepterChoice = null;

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rps_pvp_rock_${game.gameId}`)
            .setLabel('🪨 Rock')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`rps_pvp_paper_${game.gameId}`)
            .setLabel('📄 Paper')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`rps_pvp_scissors_${game.gameId}`)
            .setLabel('✂️ Scissors')
            .setStyle(ButtonStyle.Primary)
        );

      embed.setDescription(embed.data.description + `\n\n**Round ${game.currentRound}/${game.rounds}**\nBoth players choose your moves:`);

      await interaction.editReply({
        embeds: [embed],
        components: [buttons]
      });
    }

  } catch (error) {
    console.error('Error resolving round:', error);
    await interaction.followUp({
      content: '❌ An error occurred while resolving the round!',
      ephemeral: true
    }).catch(console.error);
  }
}

// Helper function to determine winner
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'tie';
  
  const wins = {
    'rock': 'scissors',
    'paper': 'rock',
    'scissors': 'paper'
  };
  
  if (wins[choice1] === choice2) {
    return 'player1'; // Also returns 'player' for bot games when called with bot choice as choice2
  } else {
    return 'player2'; // Also returns 'bot' for bot games when called with bot choice as choice2
  }
}

// Helper function to get emoji for choices
function getEmoji(choice) {
  const emojis = {
    'rock': '🪨',
    'paper': '📄',
    'scissors': '✂️'
  };
  return emojis[choice] || '❓';
}
