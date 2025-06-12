const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Kick logic here
    await interaction.guild.members.kick(user, { reason });

    // DM the user
    try {
      await user.send(`You have been kicked from ${interaction.guild.name}. Reason: ${reason}`);
    } catch (error) {
      console.error(`Could not send DM to ${user.tag}:`, error);
    }

    // Logging
    const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-logs');
    if (logChannel) {
      logChannel.send(`User ${user.tag} was kicked. Reason: ${reason}`);
    }

    await interaction.reply({ content: `Kicked ${user.tag}. Reason: ${reason}`, ephemeral: true });
  }
};