import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStoreItems } from '../../utils/inventoryUtils';

export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View available items in the shop');

export async function execute(interaction: CommandInteraction) {
    const items = await getStoreItems();
    
    const embed = new EmbedBuilder()
        .setTitle('🛍️ Shop')
        .setColor('#00ff00')
        .setDescription('Available items for purchase:')
        .addFields(
            items.map(item => ({
                name: `${item.name} (${item.price} coins)`,
                value: item.description
            }))
        );

    await interaction.reply({ embeds: [embed] });
}
