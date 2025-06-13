import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { updateUserCoins, getUserCoins } from '../../utils/coinUtils';

export const data = new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin to win or lose coins')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Amount of coins to bet')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('choice')
            .setDescription('Heads or Tails')
            .setRequired(true)
            .addChoices(
                { name: 'Heads', value: 'heads' },
                { name: 'Tails', value: 'tails' }
            )
    );

export async function execute(interaction: CommandInteraction) {
    const amount = interaction.options.getInteger('amount');
    const choice = interaction.options.getString('choice');
    const userId = interaction.user.id;

    const userCoins = await getUserCoins(userId);
    if (userCoins < amount) {
        return interaction.reply({ content: 'You don\'t have enough coins!', ephemeral: true });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice === result;
    const changeAmount = won ? amount : -amount;

    await updateUserCoins(userId, changeAmount);

    await interaction.reply({ 
        content: `You ${won ? 'won' : 'lost'} ${Math.abs(changeAmount)} coins!`,
        ephemeral: true 
    });

    await interaction.channel.send(
        `${interaction.user} just ${won ? 'won' : 'lost'} ${Math.abs(changeAmount)} coins in coinflip!`
    );
}
