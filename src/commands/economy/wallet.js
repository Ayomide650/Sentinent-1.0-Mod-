const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserCoins } = require('../../utils/coinUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your coin balance'),

    async execute(interaction) {
        try {
            // Check if user is admin
            const isAdmin = interaction.member.permissions.has('Administrator');
            
            if (isAdmin) {
                return await interaction.reply({
                    content: `Your wallet balance: 999999999 coins 👑`,
                    ephemeral: true
                });
            }

            // Fixed: Pass guildId first, then userId
            const coins = await getUserCoins(interaction.guild.id, interaction.user.id);
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`${interaction.user.username}'s Wallet`)
                .setDescription(`Current Balance: ${coins} coins 🪙`)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in wallet command:', error);
            await interaction.reply({
                content: 'Error checking wallet balance!',
                ephemeral: true
            });
        }
    }
};
