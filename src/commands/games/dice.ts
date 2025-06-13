import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getUserCoins, updateUserCoins } from '../../utils/coinUtils';

export const data = new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Play dice with multipliers')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Amount to bet')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('number1')
            .setDescription('First number (1-6)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(6)
    )
    .addIntegerOption(option =>
        option.setName('number2')
            .setDescription('Second number (1-6)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(6)
    )
    .addStringOption(option =>
        option.setName('multipliers')
            .setDescription('Choose multiplier combination')
            .setRequired(true)
            .addChoices(
                { name: '3x and 2x', value: '3_2' },
                { name: '4x and 1x', value: '4_1' }
            )
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.channelId || interaction.channel?.name !== 'game-channel') {
        return interaction.reply({
            content: 'This command can only be used in #game-channel!',
            ephemeral: true
        });
    }

    const amount = interaction.options.getInteger('amount', true);
    const number1 = interaction.options.getInteger('number1', true);
    const number2 = interaction.options.getInteger('number2', true);
    const multiplierChoice = interaction.options.getString('multipliers', true);

    const userCoins = await getUserCoins(interaction.user.id);
    if (userCoins < amount) {
        return interaction.reply({
            content: 'You don\'t have enough coins!',
            ephemeral: true
        });
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let multiplier = 0;

    if (diceRoll === number1) {
        multiplier = multiplierChoice === '3_2' ? 3 : 4;
    } else if (diceRoll === number2) {
        multiplier = multiplierChoice === '3_2' ? 2 : 1;
    }

    const winAmount = multiplier ? (amount * multiplier) - amount : -amount;
    await updateUserCoins(interaction.user.id, winAmount);

    await interaction.reply({
        content: `Dice rolled: ${diceRoll}\n${multiplier ? 'You won' : 'You lost'} ${Math.abs(winAmount)} coins!`,
        ephemeral: true
    });

    await interaction.channel?.send(
        `${interaction.user} just ${multiplier ? 'won' : 'lost'} ${Math.abs(winAmount)} coins in dice!`
    );
}
