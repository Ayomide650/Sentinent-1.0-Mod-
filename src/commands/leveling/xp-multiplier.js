const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase configuration missing in xp-multiplier command');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setMultiplier(guildId, roleId, multiplier) {
  try {
    const { data, error } = await supabase
      .from('xp_multipliers')
      .upsert({
        guild_id: guildId,
        role_id: roleId,
        multiplier: multiplier,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'guild_id,role_id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting multiplier:', error);
    throw error;
  }
}

async function getMultipliers(guildId) {
  try {
    const { data, error } = await supabase
      .from('xp_multipliers')
      .select('*')
      .eq('guild_id', guildId)
      .order('multiplier', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting multipliers:', error);
    return [];
  }
}

async function removeMultiplier(guildId, roleId) {
  try {
    const { data, error } = await supabase
      .from('xp_multipliers')
      .delete()
      .eq('guild_id', guildId)
      .eq('role_id', roleId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing multiplier:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-multiplier')
    .setDescription('Configure XP multipliers for roles')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set an XP multiplier for a role')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to set multiplier for')
            .setRequired(true)
        )
        .addNumberOption(opt =>
          opt.setName('multiplier')
            .setDescription('Multiplier value (0.1 to 5.0)')
            .setRequired(true)
            .setMinValue(0.1)
            .setMaxValue(5.0)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an XP multiplier from a role')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to remove multiplier from')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all XP multipliers')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return await interaction.reply({
        content: '❌ Database configuration is missing. Please contact the server administrator.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'set':
          await handleSetMultiplier(interaction);
          break;
        case 'remove':
          await handleRemoveMultiplier(interaction);
          break;
        case 'list':
          await handleListMultipliers(interaction);
          break;
      }
    } catch (error) {
      console.error(`Error in xp-multiplier ${subcommand} command:`, error);
      const errorMessage = {
        content: '❌ An error occurred while managing XP multipliers.',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};

async function handleSetMultiplier(interaction) {
  const role = interaction.options.getRole('role');
  const multiplier = interaction.options.getNumber('multiplier');

  if (role.id === interaction.guild.id) {
    return await interaction.reply({
      content: '❌ Cannot set multiplier for @everyone role.',
      ephemeral: true
    });
  }

  await setMultiplier(interaction.guild.id, role.id, multiplier);

  await interaction.reply({
    content: `✅ Set XP multiplier for role **${role.name}** to **${multiplier}x**`,
    ephemeral: true
  });
}

async function handleRemoveMultiplier(interaction) {
  const role = interaction.options.getRole('role');
  await removeMultiplier(interaction.guild.id, role.id);

  await interaction.reply({
    content: `✅ Removed XP multiplier from role **${role.name}**`,
    ephemeral: true
  });
}

async function handleListMultipliers(interaction) {
  const multipliers = await getMultipliers(interaction.guild.id);

  if (!multipliers || multipliers.length === 0) {
    return await interaction.reply({
      content: '📋 No XP multipliers configured for this server.',
      ephemeral: true
    });
  }

  let description = '**Current XP Multipliers:**\n\n';
  for (const mult of multipliers) {
    const role = interaction.guild.roles.cache.get(mult.role_id);
    const roleName = role ? role.name : `Unknown Role (${mult.role_id})`;
    description += `**${roleName}**: ${mult.multiplier}x\n`;
  }

  const embed = {
    title: '⚡ XP Multipliers',
    description: description,
    color: 0x00ff00,
    footer: {
      text: `${multipliers.length} multiplier${multipliers.length === 1 ? '' : 's'} configured`
    },
    timestamp: new Date().toISOString()
  };

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
