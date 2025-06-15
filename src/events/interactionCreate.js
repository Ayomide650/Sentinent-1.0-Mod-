module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ...existing code...

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'sendMessageModal') {
        const messageContent = interaction.fields.getTextInputValue('messageContent');
        const channelId = interaction.fields.getTextInputValue('channelId');
        const mentionEveryone = interaction.fields.getTextInputValue('mentionEveryone').toLowerCase() === 'yes';

        try {
          const channel = await interaction.guild.channels.fetch(channelId);
          if (!channel) {
            return interaction.reply({ content: 'Invalid channel ID!', ephemeral: true });
          }

          const finalMessage = mentionEveryone ? `@everyone\n${messageContent}` : messageContent;
          await channel.send(finalMessage);

          await interaction.reply({
            content: 'Message sent successfully!',
            ephemeral: true
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: 'Failed to send message. Please check the channel ID and try again.',
            ephemeral: true
          });
        }
      }
    }

    // ...existing code...
  }
};
