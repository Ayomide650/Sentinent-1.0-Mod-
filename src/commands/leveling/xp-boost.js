const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setXPBoost(guildId, roleId, multiplier, duration = null) {
  try {
    const expiresAt = duration ? new Date(Date.now() + duration * 3600000) : null;
    
    const { data, error } = await supabase
      .from('xp_boosts')
      .upsert({
        guild_id: guildId,
        role_id: roleId,
        multiplier: multiplier,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting XP boost:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-boost')
    .setDescription('Manage XP boosts for roles')
    .addSubcommand(sub => 
      sub.setName('set')
        .setDescription('Set an XP boost for a role')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to boost').setRequired(true))
        .addNumberOption(opt => 
          opt.setName('multiplier')
            .setDescription('XP multiplier (1.5 = 50% boost)')
            .setRequired(true)
            .setMinValue(1.1)
            .setMaxValue(5.0)
        )
        .addIntegerOption(opt => 
          opt.setName('duration')
            .setDescription('Duration in hours (leave empty for permanent)')
            .setMinValue(1)
        )
    )
    .addSubcommand(sub => 
      sub.setName('list')
        .setDescription('List active XP boosts')
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove an XP boost')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to remove boost from').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { options, guild } = interaction;
    const subcommand = options.getSubcommand();

    try {
      if (subcommand === 'set') {
        const role = options.getRole('role');
        const multiplier = options.getNumber('multiplier');
        const duration = options.getInteger('duration');

        await setXPBoost(guild.id, role.id, multiplier, duration);

        return interaction.reply({ content: `XP boost for ${role} set to ${multiplier}x.`, ephemeral: true });
      } 
      // Implement 'list' and 'remove' subcommands...
    } catch (error) {
      return interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }
};
