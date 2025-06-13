const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, updateUserCoins } = require('../../utils/coinUtils');
const { purchaseItem, getStoreItems } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase an item from the shop')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item to purchase')
                .setRequired(true)
        ),

    async execute(interaction) {
        const itemName = interaction.options.getString('item');
        const items = await getStoreItems();
        const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (!item) {
            return interaction.reply({
                content: 'Item not found in shop!',
                ephemeral: true
            });
        }

        const userCoins = await getUserCoins(interaction.user.id);
        if (userCoins < item.price) {
            return interaction.reply({
                content: `You need ${item.price} coins to buy this item!`,
                ephemeral: true
            });
        }

        try {
            await purchaseItem(interaction.user.id, item.name);
            await updateUserCoins(interaction.user.id, -item.price);
            
            await interaction.reply({
                content: `Successfully purchased ${item.name}!`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to purchase item. Please try again.',
                ephemeral: true
            });
        }
    }
};
