// /src/events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
      }
      
      // Handle modal submissions
      else if (interaction.isModalSubmit()) {
        const modalHandlers = require('../handlers/modalHandlers');
        await modalHandlers.handle(interaction);
      }
      
      // Handle button interactions
      else if (interaction.isButton()) {
        const buttonHandlers = require('../handlers/buttonHandlers');
        await buttonHandlers.handle(interaction);
      }
      
    } catch (error) {
      console.error('Fatal error in interactionCreate:', error);
    }
  }
};

async function handleSlashCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  
  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing ${interaction.commandName}:`, error);
    
    // Safe error handling - check interaction state before replying
    try {
      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true
      };
      
      // Check if interaction is still valid and not expired
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(errorMessage);
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.editReply(errorMessage);
      }
      // If already replied, don't try to send another response
      
    } catch (replyError) {
      console.error('Failed to send error message for command:', replyError);
    }
  }
}
