const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../database/database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addcoins')
		.setDescription('Add coins to a user')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addUserOption(option => option.setName('target').setDescription('The user to add coins to').setRequired(true))
		.addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to add').setRequired(true)),
	async execute(interaction) {
		// Add debug logging to check if supabase is defined
		if (!supabase) {
			console.error('Supabase client is undefined');
			return interaction.reply({ content: 'Database connection error.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('target');
		const amount = interaction.options.getInteger('amount');

		if (!targetUser || !amount) {
			return interaction.reply({ content: 'Please provide a valid user and amount of coins.', ephemeral: true });
		}

		try {
			const { data: userData, error: fetchError } = await supabase
				.from('user_coins')
				.select('coins')
				.eq('user_id', targetUser.id)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
				console.error('Fetch error:', fetchError);
				return interaction.reply({ content: `Error fetching user data: ${fetchError.message}`, ephemeral: true });
			}

			const currentCoins = userData?.coins || 0;
			const newBalance = currentCoins + amount;

			// NO USERNAME FIELD HERE - This is the key fix
			const { error: upsertError } = await supabase
				.from('user_coins')
				.upsert({
					guild_id: interaction.guild.id,
					user_id: targetUser.id,
					coins: newBalance
				});

			if (upsertError) {
				console.error('Upsert error:', upsertError);
				return interaction.reply({ content: `Error updating user coins: ${upsertError.message}`, ephemeral: true });
			}

			return interaction.reply({ 
				content: `Successfully added ${amount} coins to ${targetUser.username}. New balance: ${newBalance} coins.`, 
				ephemeral: true 
			});

		} catch (error) {
			console.error('Command execution error:', error);
			return interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
		}
	},
};
