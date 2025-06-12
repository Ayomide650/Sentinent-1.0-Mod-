const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Lookup a user by ID')
    .addStringOption(opt => opt.setName('user_id').setDescription('User ID').setRequired(true)),
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    try {
      const user = await interaction.client.users.fetch(userId);
      const embed = new EmbedBuilder()
        .setTitle(`User Lookup: ${user.tag}`)
        .addFields(
          { name: 'ID', value: user.id, inline: true },
          { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setThumbnail(user.displayAvatarURL())
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
    }
  }
};
