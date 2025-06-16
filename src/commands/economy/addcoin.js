const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { supabase } = require('../../database/database');  // Fixed path to match src/database/database.js

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addcoins')
		.setDescription('Add coins to a user')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addUserOption(option => option.setName('target').setDescription('The user to add coins to').setRequired(true))
		.addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to add').setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');
		const amount = interaction.options.getInteger('amount');

		if (!targetUser || !amount) {
			return interaction.reply({ content: 'Please provide a valid user and amount of coins.', ephemeral: true });
		}

		const { data: userData, error: fetchError } = await supabase
			.from('user_coins')
			.select('coins')
			.eq('user_id', targetUser.id)
			.single();

		if (fetchError) {
			return interaction.reply({ content: `Error fetching user data: ${fetchError.message}`, ephemeral: true });
		}

		const newBalance = (userData?.coins || 0) + amount;

		const { error: upsertError } = await supabase
			.from('user_coins')
			.upsert({
				guild_id: interaction.guild.id,
				user_id: targetUser.id,
				coins: newBalance,
				username: targetUser.username
			});

		if (upsertError) {
			return interaction.reply({ content: `Error updating user coins: ${upsertError.message}`, ephemeral: true });
		}

		return interaction.reply({ content: `Successfully added ${amount} coins to ${targetUser.username}. New balance: ${newBalance} coins.`, ephemeral: true });
	},
};
