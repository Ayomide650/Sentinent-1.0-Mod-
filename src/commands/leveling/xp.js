const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// ...import your database/user model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Quick XP lookup and progress info')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    // ...fetch user XP/level data from your database...
    const userData = await getUserLevelData(interaction.guild.id, user.id); // implement this
    if (!userData) return interaction.reply({ content: 'No XP data found for this user.', ephemeral: true });

    const xpForNext = getXpForLevel(userData.level + 1); // implement this
    const xpForCurrent = getXpForLevel(userData.level);
    const xpNeeded = xpForNext - userData.xp;
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s XP`)
      .setColor(0x43b581)
      .addFields(
        { name: 'Level', value: `${userData.level}`, inline: true },
        { name: 'XP', value: `${userData.xp}`, inline: true },
        { name: 'XP Needed for Next Level', value: `${xpNeeded}`, inline: true }
      )
      .setThumbnail(user.displayAvatarURL());
    await interaction.reply({ embeds: [embed] });
  }
};

// Helper functions (implement these in your utils/db)
function getXpForLevel(level) {
  if (level <= 1) return 0;
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.round(20 * 50 * Math.pow(1.05, i - 1));
  }
  return xp;
}
