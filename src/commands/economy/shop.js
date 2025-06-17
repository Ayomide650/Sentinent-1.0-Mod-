const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getStoreItems } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View available items in the shop')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Filter items by category')
                .setRequired(false)
                .addChoices(
                    { name: 'All Items', value: 'all' },
                    { name: 'Boosts', value: 'boosts' },
                    { name: 'Cosmetics', value: 'cosmetics' },
                    { name: 'Items', value: 'items' },
                    { name: 'Mystery', value: 'mystery' }
                )
        ),
    
    async execute(interaction) {
        try {
            const category = interaction.options.getString('category') || 'all';
            const items = await getStoreItems(category);
            
            if (!items || items.length === 0) {
                return await interaction.reply({
                    content: '🛍️ The shop is currently empty or that category has no items!',
                    ephemeral: true
                });
            }
            
            // Group items by category for better display
            const categorizedItems = {};
            items.forEach(item => {
                if (!categorizedItems[item.category]) {
                    categorizedItems[item.category] = [];
                }
                categorizedItems[item.category].push(item);
            });
            
            const embed = new EmbedBuilder()
                .setTitle('🛍️ **Economy Shop**')
                .setColor('#00d4ff')
                .setDescription('💰 Browse and purchase items with your coins!\n*Use `/buy <item_name>` to purchase an item*')
                .setThumbnail(interaction.guild?.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ 
                    text: `${interaction.guild?.name || 'Server'} Shop • Total Items: ${items.length}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                });
            
            // Add fields for each category
            Object.entries(categorizedItems).forEach(([cat, catItems]) => {
                const categoryName = cat.charAt(0).toUpperCase() + cat.slice(1);
                const itemList = catItems.map(item => {
                    const stockInfo = item.in_stock ? '' : ' **(OUT OF STOCK)**';
                    const limitInfo = item.max_quantity ? ` *(Max: ${item.max_quantity})*` : '';
                    return `${item.emoji} **${item.name}** - ${item.price.toLocaleString()} coins${stockInfo}${limitInfo}\n*${item.description}*`;
                }).join('\n\n');
                
                embed.addFields({
                    name: `${getCategoryEmoji(cat)} ${categoryName}`,
                    value: itemList.length > 1024 ? itemList.substring(0, 1020) + '...' : itemList,
                    inline: false
                });
            });
            
            // Add quick purchase dropdown (optional enhancement)
            const availableItems = items.filter(item => item.in_stock);
            let components = [];
            
            if (availableItems.length > 0 && availableItems.length <= 25) {
                const selectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('quick_buy_select')
                            .setPlaceholder('🛒 Quick purchase an item...')
                            .addOptions(
                                availableItems.slice(0, 25).map(item => ({
                                    label: `${item.name} (${item.price.toLocaleString()} coins)`,
                                    description: item.description.length > 100 ? 
                                        item.description.substring(0, 97) + '...' : 
                                        item.description,
                                    value: item.id.toString(),
                                    emoji: item.emoji
                                }))
                            )
                    );
                components = [selectMenu];
            }
            
            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: false
            });
            
        } catch (error) {
            console.error('Error in shop command:', error);
            
            await interaction.reply({
                content: '❌ There was an error loading the shop. Please try again later.',
                ephemeral: true
            });
        }
    }
};

function getCategoryEmoji(category) {
    const emojis = {
        'boosts': '⚡',
        'cosmetics': '🎨',
        'items': '🎁',
        'mystery': '❓',
        'general': '🛍️'
    };
    return emojis[category] || '🛍️';
}
