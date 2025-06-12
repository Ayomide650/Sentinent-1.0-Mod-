const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/guild settings model...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-roles')
    .setDescription('Add or remove XP-eligible roles (admin only)')
    .addStringOption(opt => opt.setName('action').setDescription('add or remove').setRequired(true).addChoices(
      { name: 'add', value: 'add' },
      { name: 'remove', value: 'remove' }
    ))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to modify').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    // ...update XP-eligible roles in your database...
    if (action === 'add') {
      await addXpRole(interaction.guild.id, role.id); // implement this
      await interaction.reply({ content: `Added ${role} as an XP-eligible role.`, ephemeral: true });
    } else {
      await removeXpRole(interaction.guild.id, role.id); // implement this
      await interaction.reply({ content: `Removed ${role} from XP-eligible roles.`, ephemeral: true });
    }
  }
};
