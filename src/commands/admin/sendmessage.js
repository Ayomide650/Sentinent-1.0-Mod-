const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendmessage')
        .setDescription('Send a message as the bot (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user has admin role
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: 'Please enter the message you want to send:',
            ephemeral: true
        });

        try {
            const messageFilter = m => m.author.id === interaction.user.id;
            const messageCollector = interaction.channel.createMessageCollector({
                filter: messageFilter,
                time: 60000,
                max: 1
            });

            messageCollector.on('collect', async (message) => {
                const messageContent = message.content;
                message.delete(); // Delete the user's message

                // Ask about @everyone mention
                const everyoneResponse = await interaction.followUp({
                    content: 'Do you want to mention @everyone? (yes/no)',
                    ephemeral: true
                });

                const everyoneFilter = m => m.author.id === interaction.user.id && ['yes', 'no'].includes(m.content.toLowerCase());
                const everyoneCollector = interaction.channel.createMessageCollector({
                    filter: everyoneFilter,
                    time: 30000,
                    max: 1
                });

                everyoneCollector.on('collect', async (everyoneMsg) => {
                    const shouldMentionEveryone = everyoneMsg.content.toLowerCase() === 'yes';
                    everyoneMsg.delete(); // Delete the response

                    // Ask for target channel
                    const channelResponse = await interaction.followUp({
                        content: 'Please mention the channel where you want to send this message:',
                        ephemeral: true
                    });

                    const channelFilter = m => m.author.id === interaction.user.id && m.mentions.channels.size > 0;
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
