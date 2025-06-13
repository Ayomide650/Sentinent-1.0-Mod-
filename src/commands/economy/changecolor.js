const { SlashCommandBuilder } = require('discord.js');
const { checkItemOwnership } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changecolor')
        .setDescription('Change your name color')
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code (e.g., #FF0000)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const hasColorChange = await checkItemOwnership(interaction.user.id, 'colored_name');
        
        if (!hasColorChange) {
            return interaction.reply({
                content: 'You need to buy the Colored Name item first!',
                ephemeral: true
            });
        }

        const color = interaction.options.getString('color');
        const colorRegex = /^#[0-9A-F]{6}$/i;

        if (!colorRegex.test(color)) {
            return interaction.reply({
                content: 'Please provide a valid hex color code (e.g., #FF0000)',
                ephemeral: true
            });
        }

        try {
            let role = interaction.guild.roles.cache.find(
                r => r.name === `color-${interaction.user.id}`
            );

            if (!role) {
                role = await interaction.guild.roles.create({
                    name: `color-${interaction.user.id}`,
                    color: color,
                    position: 1
                });
            } else {
                await role.setColor(color);
            }

            await interaction.member.roles.add(role);

            await interaction.reply({
                content: 'Your name color has been updated!',
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to update color. Please try again.',
                ephemeral: true
            });
        }
    }
};
