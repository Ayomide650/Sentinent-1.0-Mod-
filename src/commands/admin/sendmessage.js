const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendmessage')
        .setDescription('Send a message as the bot (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('sendMessageModal')
            .setTitle('Send Bot Message');

        const messageInput = new TextInputBuilder()
            .setCustomId('messageContent')
            .setLabel('Message Content')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your message here...')
            .setRequired(true);

        const channelInput = new TextInputBuilder()
            .setCustomId('channelId')
            .setLabel('Channel ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the channel ID')
            .setRequired(true);

        const everyoneInput = new TextInputBuilder()
            .setCustomId('mentionEveryone')
            .setLabel('Mention @everyone? (yes/no)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('yes or no')
            .setRequired(true)
            .setMaxLength(3);

        const firstRow = new ActionRowBuilder().addComponents(messageInput);
        const secondRow = new ActionRowBuilder().addComponents(channelInput);
        const thirdRow = new ActionRowBuilder().addComponents(everyoneInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        try {
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing modal:', error);
            await interaction.reply({
                content: 'Failed to show message form.',
                ephemeral: true
            });
        }
    }
};
