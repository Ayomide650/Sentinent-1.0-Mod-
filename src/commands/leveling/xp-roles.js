const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateRoleXP(guildId, roleId, enabled, multiplier = 1.0) {
  try {
    const { data, error } = await supabase
      .from('xp_roles')
      .upsert({
        guild_id: guildId,
        role_id: roleId,
        enabled: enabled,
        multiplier: multiplier,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating role XP settings:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-roles')
    .setDescription('Manage XP settings for roles')
    .addSubcommand(sub => 
      sub.setName('enable')
        .setDescription('Enable XP gain for a role')
        .addRoleOption(opt => opt.setName('role').setDescription('Target role').setRequired(true))
        .addNumberOption(opt => 
          opt.setName('multiplier')
            .setDescription('XP multiplier for this role')
            .setMinValue(0.1)
            .setMaxValue(5.0)
        )
    )
    .addSubcommand(sub => 
      sub.setName('disable')
        .setDescription('Disable XP gain for a role')
        .addRoleOption(opt => opt.setName('role').setDescription('Target role').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('list')
        .setDescription('List role XP settings')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role');
    const multiplier = interaction.options.getNumber('multiplier');

    try {
      if (subcommand === 'enable') {
        await updateRoleXP(interaction.guild.id, role.id, true, multiplier);
        await interaction.reply({ content: `Enabled XP gain for ${role} with a multiplier of ${multiplier}.`, ephemeral: true });
      } else if (subcommand === 'disable') {
        await updateRoleXP(interaction.guild.id, role.id, false);
        await interaction.reply({ content: `Disabled XP gain for ${role}.`, ephemeral: true });
      } else if (subcommand === 'list') {
        // Implement listing of role XP settings
      }
    } catch (error) {
      await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
    }
  }
};
