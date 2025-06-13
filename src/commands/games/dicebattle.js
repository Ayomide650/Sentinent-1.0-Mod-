const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

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
            .setDescription('Amount to bet')
            .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('rounds')
            .setDescription('Number of rounds (1-5)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        ),

    async execute(interaction) {
        const opponent = interaction.options.getUser('opponent');
        const amount = interaction.options.getInteger('amount');
        const rounds = interaction.options.getInteger('rounds');

        if (opponent.id === interaction.user.id) {
            return interaction.reply({
                content: 'You cannot challenge yourself!',
                ephemeral: true
            });
        }

        if (activeGames.has(opponent.id)) {
            return interaction.reply({
                content: 'This player is already in a game!',
                ephemeral: true
            });
        }

        const userCoins = await getUserCoins(interaction.user.id);
        const opponentCoins = await getUserCoins(opponent.id);

        if (userCoins < amount || opponentCoins < amount) {
            return interaction.reply({
                content: 'One of the players doesn\'t have enough coins!',
                ephemeral: true
            });
        }

        activeGames.set(opponent.id, {
            challenger: interaction.user.id,
            amount,
            rounds,
            currentRound: 0,
            scores: { challenger: 0, opponent: 0 }
        });

        await interaction.reply({
            content: `${opponent}, you have been challenged to a dice battle by ${interaction.user}!\nBet: ${amount} coins\nRounds: ${rounds}\nUse /accept or /reject to respond.`,
            ephemeral: false
        });
    }
};
