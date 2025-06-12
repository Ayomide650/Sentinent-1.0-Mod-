const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Ban multiple users at once')
    .addStringOption(opt => opt.setName('user_ids').setDescription('Comma-separated user IDs').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const userIds = interaction.options.getString('user_ids').split(',').map(id => id.trim());
    const reason = interaction.options.getString('reason') || 'No reason provided';
    for (const userId of userIds) {
      await interaction.guild.members.ban(userId, { reason });
    }
    await interaction.reply({ content: `Banned users: ${userIds.join(', ')}. Reason: ${reason}`, ephemeral: true });
  }
};