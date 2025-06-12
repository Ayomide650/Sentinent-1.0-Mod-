const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlockdown')
    .setDescription('Unlock all channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    }
    await interaction.reply({ content: 'Server lockdown lifted. All channels unlocked.', ephemeral: true });
  }
};