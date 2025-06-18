const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

// Store active bot games
const activeBotGames = new Map();

module.exports = {
  activeBotGames, // Export the Map so other files can access it
  data: new SlashCommandBuilder()
    .setName('rps-bot')
    .setDescription('Play Rock Paper Scissors against the bot')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount of coins to bet')
        .setRequired(true)
        .setMinValue(1))
    .addIntegerOption(option =>
      option.setName('rounds')
        .setDescription('Number of rounds to play (default: 3)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;
    const bet = interaction.options.getInteger('bet');
    const rounds = interaction.options.getInteger('rounds') || 3;

    try {
      // Channel restriction check
      if (interaction.channel?.name !== 'game-channel') {
        return await interaction.reply({ 
          content: '🚫 This command can only be used in the #game-channel!',
          ephemeral: true 
        });
      }

      // Check if user already has an active game
      if (activeBotGames.has(userId)) {
        return await interaction.reply({
          content: '❌ You already have an active game! Finish it first.',
          ephemeral: true
        });
      }

      // Input validation
      if (bet <= 0) {
        return await interaction.reply({ 
          content: '❌ Bet amount must be greater than 0!',
          ephemeral: true 
        });
      }

      // Check if user has enough coins
      const userCoins = await getUserCoins(guildId, userId);
      if (userCoins < bet) {
        return await interaction.reply({
          content: `❌ You don't have enough coins! You have ${userCoins} coins but need ${bet}.`,
          ephemeral: true
        });
      }

      // Deduct bet from user's coins
      await updateUserCoins(guildId, userId, -bet);

      // Create game object
      const gameData = {
        userId,
        guildId,
        totalBet: bet,
        rounds,
        currentRound: 1,
        playerWins: 0,
        botWins: 0,
        createdAt: Date.now()
      };

      // Store the game
      activeBotGames.set(userId, gameData);

      // Create buttons
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
        .setDescription(`**Round 1/${rounds}**\n\n` +
                       `💰 **Bet:** ${bet} coins\n` +
                       `🎯 **Rounds:** ${rounds}\n\n` +
                       `Choose your move:`)
        .setFooter({ text: `Player: ${interaction.user.username}` })
        .setTimestamp();

      // Reply with ephemeral embed
      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
      });

      // Set a timeout to clean up inactive games (5 minutes)
      setTimeout(() => {
        if (activeBotGames.has(userId)) {
          activeBotGames.delete(userId);
          // Refund the bet if the game times out
          updateUserCoins(guildId, userId, bet).catch(console.error);
        }
      }, 5 * 60 * 1000); // 5 minutes

    } catch (error) {
      console.error('Error in rps-bot command:', error);
      
      // Clean up game data if it exists
      if (activeBotGames.has(userId)) {
        const gameData = activeBotGames.get(userId);
        activeBotGames.delete(userId);
        // Refund the bet
        updateUserCoins(gameData.guildId, gameData.userId, gameData.totalBet).catch(console.error);
      }

      // Safe error response - check if we can still reply
      const errorMessage = {
        content: '❌ An error occurred while starting the game. Please try again.',
        ephemeral: true
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
        // If we can't reply, at least log the original error
      }
    }
  }
};
