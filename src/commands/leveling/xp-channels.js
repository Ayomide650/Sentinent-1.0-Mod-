const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/guild settings model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-channels')
    .setDescription('Add or remove XP-enabled channels (admin only)')
    .addStringOption(opt => opt.setName('action').setDescription('add or remove').setRequired(true).addChoices(
      { name: 'add', value: 'add' },
      { name: 'remove', value: 'remove' }
    ))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to modify').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const channel = interaction.options.getChannel('channel');
    // ...update XP-enabled channels in your database...
    if (action === 'add') {
      await addXpChannel(interaction.guild.id, channel.id); // implement this
      await interaction.reply({ content: `Added ${channel} as an XP-enabled channel.`, ephemeral: true });
    } else {
      await removeXpChannel(interaction.guild.id, channel.id); // implement this
      await interaction.reply({ content: `Removed ${channel} from XP-enabled channels.`, ephemeral: true });
    }
  }
};
