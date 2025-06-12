const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/guild settings model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-multiplier')
    .setDescription('Set server-wide XP multiplier (admin only)')
    .addNumberOption(opt => opt.setName('multiplier').setDescription('Multiplier (0.5 - 3.0)').setMinValue(0.5).setMaxValue(3.0).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const multiplier = interaction.options.getNumber('multiplier');
    // ...save multiplier to guild settings in your database...
    await setGuildXpMultiplier(interaction.guild.id, multiplier); // implement this
    await interaction.reply({ content: `XP multiplier set to ${multiplier}x for this server.`, ephemeral: true });
  }
};
