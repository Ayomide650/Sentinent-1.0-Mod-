const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your coin balance')
        .addUserOption(opt => opt.setName('user').setDescription('Check another user\'s balance (optional)').setRequired(false)),
    
    async execute(interaction) {
        try {
            // Get target user (default to command user)
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const guildId = interaction.guild.id;
            
            console.log("guildId:", guildId);
            console.log("userId:", targetUser.id);
            
            // Get coins from database for the target user
            const coins = await getUserCoins(targetUser.id, guildId);
            
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
                        name: '💡 Tip',
                        value: 'Use `/daily` to earn coins daily!\nUse `/work` to earn more coins!',
                        inline: false
                    }
                ]);
            }
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: targetUser.id !== interaction.user.id // Make it public if checking someone else
            });
            
        } catch (error) {
            console.error('Error in wallet command:', error);
            await interaction.reply({
                content: '❌ Error checking wallet balance! Please try again.',
                ephemeral: true
            });
        }
    }
};
