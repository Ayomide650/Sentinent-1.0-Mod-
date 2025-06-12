const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/guild settings model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-boost')
    .setDescription('Give a role an XP boost (admin only)')
    .addRoleOption(opt => opt.setName('role').setDescription('Role to boost').setRequired(true))
    .addNumberOption(opt => opt.setName('multiplier').setDescription('XP multiplier (e.g. 1.5)').setMinValue(1.0).setMaxValue(5.0).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const multiplier = interaction.options.getNumber('multiplier');
    // ...save XP boost for role in your database...
    await setRoleXpBoost(interaction.guild.id, role.id, multiplier); // implement this
    await interaction.reply({ content: `Set XP boost for ${role} to ${multiplier}x.`, ephemeral: true });
  }
};
