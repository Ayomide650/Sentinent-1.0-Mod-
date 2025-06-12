const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages (optionally filter by user)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (max 100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName('user').setDescription('Delete messages from this user only').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;

    let messages = await channel.messages.fetch({ limit: 100 });
    if (user) {
      messages = messages.filter(m => m.author.id === user.id).first(amount);
    } else {
      messages = messages.first(amount);
    }
    await channel.bulkDelete(messages, true);
    await interaction.reply({ content: `Deleted ${messages.length} messages${user ? ` from ${user.tag}` : ''}.`, ephemeral: true });
  }
};