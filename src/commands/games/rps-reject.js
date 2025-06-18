const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps-reject')
        .setDescription('Reject a Rock Paper Scissors challenge'),
    
    async execute(interaction) {
        try {
            const guildId = interaction.guild?.id;
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            // Import activeInvites from rps-challenge module
            const { activeInvites } = require('./rps-challenge');
            
            if (!activeInvites) {
                return await interaction.reply({
                    content: '❌ Rock Paper Scissors system not available!',
                    ephemeral: true
                });
            }

            // Find invite for this user
            const invite = activeInvites.get(interaction.user.id);
            
            if (!invite) {
                return await interaction.reply({
                    content: '❌ No active Rock Paper Scissors challenge found for you!',
                    ephemeral: true
                });
            }

            // Get challenger info
            const challengerId = invite.challengerId;

            // Remove the invite
            activeInvites.delete(interaction.user.id);

            // Send rejection message
            await interaction.reply({
                content: `❌ <@${interaction.user.id}> has declined the Rock Paper Scissors challenge from <@${challengerId}>.`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in rps-reject command:', error);
            
            // Clean up invite if error occurs
            try {
                const { activeInvites } = require('./rps-challenge');
                if (activeInvites && activeInvites.has(interaction.user.id)) {
                    activeInvites.delete(interaction.user.id);
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }

            await interaction.reply({
                content: '❌ An error occurred while rejecting the challenge.',
                ephemeral: true
            });
        }
    }
};
