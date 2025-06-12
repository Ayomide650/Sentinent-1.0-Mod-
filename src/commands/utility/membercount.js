const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Show advanced member analytics'),
  async execute(interaction) {
    const guild = interaction.guild;
    const total = guild.memberCount;
    const online = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const embed = new EmbedBuilder()
      .setTitle('Member Count')
      .addFields(
        { name: 'Total', value: `${total}`, inline: true },
        { name: 'Online', value: `${online}`, inline: true },
        { name: 'Bots', value: `${bots}`, inline: true }
      )
      .setColor(0x7289da);
    await interaction.reply({ embeds: [embed] });
  }
};
