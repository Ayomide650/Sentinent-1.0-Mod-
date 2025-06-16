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
            
            // Add additional info if checking own wallet
            if (targetUser.id === interaction.user.id) {
                embed.addFields([
                    {
                        name: '💡 Tips',
                        value: '• Use `/daily` to claim 500 coins every day!,
                        inline: false
                    }
                ]);
            } else {
                // Add a field showing who requested this info
                embed.addFields([
                    {
                        name: '👤 Requested by',
                        value: interaction.user.username,
                        inline: true
                    }
                ]);
            }
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: targetUser.id === interaction.user.id // Private if checking own wallet, public if checking others
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
