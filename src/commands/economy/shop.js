const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStoreItems } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View available items in the shop'),

    async execute(interaction) {
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
};
