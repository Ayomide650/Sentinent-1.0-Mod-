const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Show a user\'s permissions in a channel')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to check').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const member = await interaction.guild.members.fetch(user.id);
    const perms = channel.permissionsFor(member);
    const embed = new EmbedBuilder()
      .setTitle(`Permissions for ${user.tag} in #${channel.name}`)
      .setDescription(perms.toArray().join(', '))
      .setColor(0x43b581);
    await interaction.reply({ embeds: [embed] });
  }
};
