const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your coin balance')
        .addUserOption(opt => 
            opt.setName('user')
               .setDescription('Check another user\'s balance (optional)')
               .setRequired(false)
        ),
    
    async execute(interaction) {
        try {
            // Get target user (default to command user)
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const guildId = interaction.guild?.id;
            
            // Check if user can view other wallets (admin permission or own wallet)
            const canViewOthers = interaction.member.permissions.has('Administrator');
            
            if (targetUser.id !== interaction.user.id && !canViewOthers) {
                return await interaction.reply({
                    content: '❌ You can only check your own wallet balance. Only administrators can check other users\' wallets.',
                    ephemeral: true
                });
            }
            
            // Validate guild context
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server.',
                    ephemeral: true
                });
            }
            
            console.log("guildId:", guildId);
            console.log("userId:", targetUser.id);
            
            // FIXED: Correct parameter order - guildId first, then userId
            const coins = await getUserCoins(guildId, targetUser.id);
            
            console.log("Retrieved coins:", coins);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`${targetUser.username}'s Wallet`)
                .setDescription(`💰 **Current Balance:** ${coins.toLocaleString()} coins`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ 
                    text: `${interaction.guild.name} Economy`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                });
            
            // Add additional info based on context
            if (targetUser.id === interaction.user.id) {
                // User checking own wallet
                embed.addFields([
                    {
                        name: '💡 Tips',
                        value: '• Use `/daily` to claim 500 coins every day!',
                        inline: false
                    }
                ]);
            } else {
                // Admin checking another user's wallet
                embed.addFields([
                    {
                        name: '👤 Requested by',
                        value: `${interaction.user.username} (Administrator)`,
                        inline: true
                    }
                ]);
            }
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: true // Always private to protect user privacy
            });
            
        } catch (error) {
            console.error('Error in wallet command:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                guildId: interaction.guild?.id,
                userId: interaction.user.id,
                targetUserId: interaction.options.getUser('user')?.id
            });
            
            // Handle different types of errors
            let errorMessage = '❌ Error checking wallet balance! Please try again.';
            
            if (error.message.includes('database') || error.message.includes('connection')) {
                errorMessage = '❌ Database connection issue. Please try again in a moment.';
            }
            
            // Ensure we can reply even if there's an error
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ 
                    content: errorMessage,
                    embeds: [] 
                });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        }
    }
};
