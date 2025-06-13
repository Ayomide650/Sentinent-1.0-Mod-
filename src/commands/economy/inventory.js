const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserInventory } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your inventory'),

    async execute(interaction) {
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
};
