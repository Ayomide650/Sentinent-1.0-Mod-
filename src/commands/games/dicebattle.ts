import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getUserCoins, updateUserCoins } from '../../utils/coinUtils';

export const data = new SlashCommandBuilder()
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
    );

const activeGames = new Map();

export async function execute(interaction: CommandInteraction) {
    const opponent = interaction.options.getUser('opponent');
    const amount = interaction.options.getInteger('amount');
    const rounds = interaction.options.getInteger('rounds');
    
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
        scores: { challenger: 0, opponent: 0 }
    });

    // Game logic implementation here
}
