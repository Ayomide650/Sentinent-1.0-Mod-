const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    }
    await interaction.reply({ content: 'Server is now in lockdown. All channels locked.', ephemeral: true });
  }
};