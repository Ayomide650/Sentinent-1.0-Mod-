import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserInventory } from '../../utils/inventoryUtils';

export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory');

export async function execute(interaction: CommandInteraction) {
    const inventory = await getUserInventory(interaction.user.id);
    
    const embed = new EmbedBuilder()
        .setTitle('🎒 Your Inventory')
        .setColor('#0099ff')
        .setDescription(
            inventory.length ? 'Your items:' : 'Your inventory is empty!'
        )
        .addFields(
            inventory.map(item => ({
                name: item.name,
                value: `${item.active ? '(Active) ' : ''}${item.description}`
            }))
        );

    await interaction.reply({ 
        embeds: [embed],
        ephemeral: true 
    });
}
