const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Toggle link deletion in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    // ...toggle antilink in your database for this channel...
    const enabled = await toggleAntilink(interaction.guild.id, interaction.channel.id); // implement this
    await interaction.reply({ content: `Antilink is now ${enabled ? 'enabled' : 'disabled'} in this channel.`, ephemeral: true });
  }
};