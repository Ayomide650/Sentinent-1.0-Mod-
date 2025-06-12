const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/warning system...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a user\'s warning history')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    // ...fetch warnings from database...
    const warnings = []; // Replace with actual fetch
    const embed = new EmbedBuilder()
      .setTitle(`${user.tag}'s Warnings`)
      .setColor(0xffcc00)
      .setDescription(warnings.length ? warnings.map((w, i) => `**${i + 1}.** ${w.reason} - <@${w.moderator}> (${w.date})`).join('\n') : 'No warnings.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
