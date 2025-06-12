const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot invite link'),
  async execute(interaction) {
    const clientId = interaction.client.user.id;
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    const embed = new EmbedBuilder()
      .setTitle('Invite Me!')
      .setDescription(`[Click here to invite the bot](${inviteUrl})`)
      .setColor(0x43b581);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
