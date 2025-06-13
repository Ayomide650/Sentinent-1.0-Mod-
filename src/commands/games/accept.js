const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Accept a dice battle challenge'),

    async execute(interaction) {
        const activeGames = require('./dicebattle').activeGames;
        const game = activeGames.get(interaction.user.id);

        if (!game) {
            return interaction.reply({
                content: 'No active challenge found!',
                ephemeral: true
            });
        }

        // Start dice battle game
        let p1Score = 0;
        let p2Score = 0;
        const roundsToWin = Math.ceil(game.rounds / 2);

        for (let round = 1; round <= game.rounds; round++) {
            const p1Roll = Math.floor(Math.random() * 6) + 1;
            const p2Roll = Math.floor(Math.random() * 6) + 1;

            if (p1Roll > p2Roll) p1Score++;
            else if (p2Roll > p1Roll) p2Score++;
            else round--; // Tie, replay round

            await interaction.channel.send(
                `Round ${round}: 🎲 Player 1 rolled ${p1Roll} | Player 2 rolled ${p2Roll} 🎲`
            );

            if (p1Score >= roundsToWin || p2Score >= roundsToWin) break;
        }

        const winner = p1Score > p2Score ? game.challenger : interaction.user.id;
        const loser = p1Score > p2Score ? interaction.user.id : game.challenger;

        await updateUserCoins(winner, game.amount);
        await updateUserCoins(loser, -game.amount);

        activeGames.delete(interaction.user.id);

        await interaction.reply(
            `Game Over! <@${winner}> wins ${game.amount} coins! (Score: ${p1Score}-${p2Score})`
        );
    }
};
