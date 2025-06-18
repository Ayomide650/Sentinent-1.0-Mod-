// /src/handlers/modalHandlers.js

async function handle(interaction) {
  try {
    if (interaction.customId === 'sendMessageModal') {
      await handleSendMessageModal(interaction);
    } else {
      console.log(`Unknown modal submission: ${interaction.customId}`);
    }
  } catch (error) {
    console.error('Error handling modal submission:', error);
    
    try {
      const errorMessage = {
        content: 'There was an error processing your submission!',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('Failed to send modal error message:', replyError);
    }
  }
}

async function handleSendMessageModal(interaction) {
  try {
    const messageContent = interaction.fields.getTextInputValue('messageContent');
    const channelId = interaction.fields.getTextInputValue('channelId');
    const mentionEveryone = interaction.fields.getTextInputValue('mentionEveryone').toLowerCase() === 'yes';
    
    const channel = await interaction.guild.channels.fetch(channelId);
    if (!channel) {
      return await interaction.reply({
        content: 'Invalid channel ID!',
        ephemeral: true
      });
    }
    
    const finalMessage = mentionEveryone ? `@everyone\n${messageContent}` : messageContent;
    await channel.send(finalMessage);
    
    await interaction.reply({
      content: 'Message sent successfully!',
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleSendMessageModal:', error);
    
    const errorMessage = {
      content: 'Failed to send message. Please check the channel ID and try again.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

module.exports = {
  handle,
  handleSendMessageModal
};
