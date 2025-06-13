const { SlashCommandBuilder } = require('discord.js');
const { checkItemOwnership, activateItem } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usexpboost')
        .setDescription('Activate your XP booster'),

    async execute(interaction) {
        const hasBooster = await checkItemOwnership(interaction.user.id, 'xp_boost');
        
        if (!hasBooster) {
            return interaction.reply({
                content: 'You don\'t have any XP boosters!',
                ephemeral: true
            });
        }

        await activateItem(interaction.user.id, 'xp_boost');
        
        await interaction.reply({
            content: '2x XP Boost activated for 1 hour!',
            ephemeral: true
        });
    }
};
