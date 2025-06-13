const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase configuration missing in xp-config command');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getGuildConfig(guildId) {
  try {
    const { data, error } = await supabase
      .from('guild_settings')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting guild config:', error);
    return null;
  }
}

async function updateGuildConfig(guildId, settings) {
  try {
    const { data, error } = await supabase
      .from('guild_settings')
      .upsert({
        guild_id: guildId,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating guild config:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-config')
    .setDescription('Configure XP system settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current XP settings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle XP system on/off')
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('Enable or disable XP system')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('xp-rate')
        .setDescription('Set base XP per message')
        .addIntegerOption(opt =>
          opt.setName('min')
            .setDescription('Minimum XP per message')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
        .addIntegerOption(opt =>
          opt.setName('max')
            .setDescription('Maximum XP per message')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cooldown')
        .setDescription('Set XP gain cooldown')
        .addIntegerOption(opt =>
          opt.setName('seconds')
            .setDescription('Cooldown in seconds')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(300)
        )
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
        case 'view':
          await handleViewConfig(interaction);
          break;
        case 'toggle':
          await handleToggleXP(interaction);
          break;
        case 'xp-rate':
          await handleXPRate(interaction);
          break;
        case 'cooldown':
          await handleCooldown(interaction);
          break;
      }
    } catch (error) {
      console.error(`Error in xp-config ${subcommand} command:`, error);
      const errorMessage = {
        content: '❌ An error occurred while managing XP configuration.',
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

async function handleViewConfig(interaction) {
  const config = await getGuildConfig(interaction.guild.id) || {};
  
  const embed = {
    title: '⚙️ XP System Configuration',
    fields: [
      {
        name: 'System Status',
        value: config.xp_enabled ? '✅ Enabled' : '❌ Disabled',
        inline: true
      },
      {
        name: 'XP per Message',
        value: config.xp_min && config.xp_max ? 
          `${config.xp_min} - ${config.xp_max} XP` : 
          '15 - 25 XP (default)',
        inline: true
      },
      {
        name: 'Cooldown',
        value: `${config.xp_cooldown || 60} seconds`,
        inline: true
      }
    ],
    color: 0x00ff00,
    timestamp: new Date().toISOString()
  };

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleToggleXP(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  await updateGuildConfig(interaction.guild.id, { xp_enabled: enabled });

  await interaction.reply({
    content: `✅ XP system has been ${enabled ? 'enabled' : 'disabled'}.`,
    ephemeral: true
  });
}

async function handleXPRate(interaction) {
  const min = interaction.options.getInteger('min');
  const max = interaction.options.getInteger('max');

  if (min > max) {
    return await interaction.reply({
      content: '❌ Minimum XP cannot be greater than maximum XP.',
      ephemeral: true
    });
  }

  await updateGuildConfig(interaction.guild.id, { xp_min: min, xp_max: max });

  await interaction.reply({
    content: `✅ XP rate set to ${min}-${max} XP per message.`,
    ephemeral: true
  });
}

async function handleCooldown(interaction) {
  const seconds = interaction.options.getInteger('seconds');
  await updateGuildConfig(interaction.guild.id, { xp_cooldown: seconds });

  await interaction.reply({
    content: `✅ XP cooldown set to ${seconds} seconds.`,
    ephemeral: true
  });
}
