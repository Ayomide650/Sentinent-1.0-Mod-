const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/guild settings model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rewards')
    .setDescription('Configure custom rewards for milestone levels (admin only)')
    .addIntegerOption(opt => opt.setName('level').setDescription('Milestone level').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Reward role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const level = interaction.options.getInteger('level');
    const role = interaction.options.getRole('role');
    // ...save reward to guild settings in your database...
    await setLevelReward(interaction.guild.id, level, role.id); // implement this
    await interaction.reply({ content: `Set reward for level ${level} to role ${role.name}.`, ephemeral: true });
  }
};
