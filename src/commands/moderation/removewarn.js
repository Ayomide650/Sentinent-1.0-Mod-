const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// ...import your database/warning system...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removewarn')
    .setDescription('Remove a specific warning from a user')
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(opt => opt.setName('warning_id').setDescription('Warning number to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const warningId = interaction.options.getInteger('warning_id');
    // ...remove warning from database, audit trail...
    await interaction.reply({ content: `Removed warning #${warningId} from ${user.tag}.`, ephemeral: true });
  }
};
