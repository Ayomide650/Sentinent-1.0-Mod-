const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages by filter (bot, images, links, etc)')
    .addStringOption(opt => opt.setName('filter').setDescription('Filter type').setRequired(true).addChoices(
      { name: 'bots', value: 'bots' },
      { name: 'images', value: 'images' },
      { name: 'links', value: 'links' },
      { name: 'embeds', value: 'embeds' },
      { name: 'keywords', value: 'keywords' }
    ))
    .addStringOption(opt => opt.setName('keyword').setDescription('Keyword for filtering').setRequired(false))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to scan (max 100)').setRequired(false).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const filter = interaction.options.getString('filter');
    const keyword = interaction.options.getString('keyword');
    const amount = interaction.options.getInteger('amount') || 100;
    const messages = await interaction.channel.messages.fetch({ limit: amount });
    let toDelete = [];
    switch (filter) {
      case 'bots':
        toDelete = messages.filter(m => m.author.bot);
        break;
      case 'images':
        toDelete = messages.filter(m => m.attachments.size > 0);
        break;
      case 'links':
        toDelete = messages.filter(m => /(https?:\/\/[^\s]+)/.test(m.content));
        break;
      case 'embeds':
        toDelete = messages.filter(m => m.embeds.length > 0);
        break;
      case 'keywords':
        if (!keyword) return interaction.reply({ content: 'Please provide a keyword.', ephemeral: true });
        toDelete = messages.filter(m => m.content.includes(keyword));
        break;
    }
    await interaction.channel.bulkDelete(toDelete, true);
    await interaction.reply({ content: `Purged ${toDelete.size || 0} messages with filter: ${filter}.`, ephemeral: true });
  }
};