const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { supabase } = require('../../../database/database');  // Updated correct path

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoins')
        .setDescription('Add coins to a user (Admin only)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to add coins to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to add')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('target');
            const amount = interaction.options.getInteger('amount');

            console.log("guildId:", interaction.guild?.id);
            console.log("userId:", targetUser?.id);

            // Check current balance
            const { data: userData, error: fetchError } = await supabase
                .from('user_coins')
                .select('coins')
                .eq('guild_id', interaction.guild.id)
                .eq('user_id', targetUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching user coins:', fetchError);
                return interaction.reply({
                    content: 'Error fetching user data!',
                    ephemeral: true
                });
            }

            const currentCoins = userData?.coins || 0;
            const newBalance = currentCoins + amount;

            // Update or insert new balance
            const { error: upsertError } = await supabase
                .from('user_coins')
                .upsert({
                    guild_id: interaction.guild.id,
                    user_id: targetUser.id,
                    coins: newBalance,
                    username: targetUser.username
                });

            if (upsertError) {
                console.error('Error updating coins:', upsertError);
                return interaction.reply({
                    content: 'Error updating coins!',
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: `Successfully added ${amount} coins to ${targetUser.username}. Their new balance is ${newBalance} coins.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in addcoins command:', error);
            return interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    },
};
