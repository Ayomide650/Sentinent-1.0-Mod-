const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendmessage')
        .setDescription('Send a message as the bot (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('sendMessageModal')
            .setTitle('Send Bot Message');

        // Add message content input
        const messageInput = new TextInputBuilder()
            .setCustomId('messageContent')
            .setLabel('Message Content')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your message here...')
            .setRequired(true);

        // Add channel input
        const channelInput = new TextInputBuilder()
            .setCustomId('channelId')
            .setLabel('Channel ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the channel ID')
            .setRequired(true);

        // Add @everyone toggle
        const everyoneInput = new TextInputBuilder()
            .setCustomId('mentionEveryone')
            .setLabel('Mention @everyone? (yes/no)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('yes or no')
            .setRequired(true)
            .setMaxLength(3);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
        const secondActionRow = new ActionRowBuilder().addComponents(channelInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(everyoneInput);

        // Add action rows to modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        // Show the modal
        await interaction.showModal(modal);
    }
};
                    const channelCollector = interaction.channel.createMessageCollector({
                        filter: channelFilter,
                        time: 30000,
                        max: 1
                    });

                    channelCollector.on('collect', async (channelMsg) => {
                        const targetChannel = channelMsg.mentions.channels.first();
                        channelMsg.delete(); // Delete the channel mention

                        // Send the final message
                        const finalMessage = shouldMentionEveryone ? `@everyone\n${messageContent}` : messageContent;
                        await targetChannel.send(finalMessage);

                        await interaction.followUp({
                            content: 'Message sent successfully!',
                            ephemeral: true
                        });
                    });

                    channelCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({
                                content: 'Channel selection timed out.',
                                ephemeral: true
                            });
                        }
                    });
                });

                everyoneCollector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp({
                            content: '@everyone selection timed out.',
                            ephemeral: true
                        });
                    }
                });
            });

            messageCollector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({
                        content: 'Message collection timed out.',
                        ephemeral: true
                    });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({
                content: 'An error occurred while processing the command.',
                ephemeral: true
            });
        }
    }
};
