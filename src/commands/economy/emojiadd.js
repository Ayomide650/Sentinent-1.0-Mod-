const { SlashCommandBuilder } = require('discord.js');
const { checkItemOwnership } = require('../../utils/inventoryUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojiadd')
        .setDescription('Submit an emoji to be added')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name for the emoji')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The emoji image')
                .setRequired(true)
        ),

    async execute(interaction) {
        const hasEmojiSlot = await checkItemOwnership(interaction.user.id, 'emoji_slot');
        
        if (!hasEmojiSlot) {
            return interaction.reply({
                content: 'You need to buy an Emoji Slot first!',
                ephemeral: true
            });
        }

        const name = interaction.options.getString('name');
        const image = interaction.options.getAttachment('image');

        if (!image.contentType?.startsWith('image/')) {
            return interaction.reply({
                content: 'Please provide a valid image file!',
                ephemeral: true
            });
        }

        try {
            await interaction.guild.emojis.create({
                attachment: image.url,
                name: name
            });

            await interaction.reply({
                content: 'Emoji has been added successfully!',
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to add emoji. Please try again.',
                ephemeral: true
            });
        }
    }
};
