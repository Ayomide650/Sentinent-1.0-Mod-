const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/logging...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user with optional reason and duration')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addStringOption(opt => opt.setName('time').setDescription('Ban duration (e.g. 1d, 2h)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const time = interaction.options.getString('time');
    // ...ban logic, temp ban scheduling, DM, logging...
    await interaction.reply({ content: `Banned ${user.tag}${time ? ` for ${time}` : ''}. Reason: ${reason}`, ephemeral: true });
  }
};
