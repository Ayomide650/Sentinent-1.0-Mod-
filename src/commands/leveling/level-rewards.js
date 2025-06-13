const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with consistent environment variable naming
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase configuration missing in level-rewards command');
  // Don't exit here as it's a command file, just log the error
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database functions
async function setLevelReward(guildId, level, roleId) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .upsert(
        { 
          guild_id: guildId, 
          level: level, 
          role_id: roleId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'guild_id,level' 
        }
      );
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting level reward:', error);
    throw error;
  }
}

async function getLevelRewards(guildId) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .select('*')
      .eq('guild_id', guildId)
      .order('level', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting level rewards:', error);
    return [];
  }
}

async function getRewardForLevel(guildId, level) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .select('*')
      .eq('guild_id', guildId)
      .eq('level', level)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Error getting reward for level:', error);
    return null;
  }
}

async function removeLevelReward(guildId, level) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .delete()
      .eq('guild_id', guildId)
      .eq('level', level);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing level reward:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rewards')
    .setDescription('Configure custom rewards for milestone levels (admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a reward for a milestone level')
        .addIntegerOption(opt => 
          opt.setName('level')
            .setDescription('Milestone level')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
        .addRoleOption(opt => 
          opt.setName('role')
            .setDescription('Reward role')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a reward for a milestone level')
        .addIntegerOption(opt => 
          opt.setName('level')
            .setDescription('Milestone level to remove')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all configured level rewards')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Check if Supabase is configured
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
          await handleSetReward(interaction);
          break;
        case 'remove':
          await handleRemoveReward(interaction);
          break;
        case 'list':
          await handleListRewards(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error(`Error in level-rewards ${subcommand} command:`, error);
      
      const errorMessage = {
        content: '❌ An error occurred while processing the level reward command.',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },

  // Export helper functions for use in leveling system
  setLevelReward,
  getLevelRewards,
  getRewardForLevel,
  removeLevelReward
};

async function handleSetReward(interaction) {
  const level = interaction.options.getInteger('level');
  const role = interaction.options.getRole('role');

  // Check if the bot can manage the role
  if (role.position >= interaction.guild.members.me.roles.highest.position) {
    return await interaction.reply({
      content: '❌ I cannot assign this role as it is higher than or equal to my highest role.',
      ephemeral: true
    });
  }

  // Check if role is manageable
  if (!role.editable) {
    return await interaction.reply({
      content: '❌ I cannot manage this role. Please check my permissions.',
      ephemeral: true
    });
  }

  // Check if role is @everyone
  if (role.id === interaction.guild.id) {
    return await interaction.reply({
      content: '❌ Cannot use @everyone as a level reward.',
      ephemeral: true
    });
  }

  // Check if a reward already exists for this level
  const existingReward = await getRewardForLevel(interaction.guild.id, level);
  const actionText = existingReward ? 'Updated' : 'Set';

  // Save reward to database
  await setLevelReward(interaction.guild.id, level, role.id);

  await interaction.reply({
    content: `✅ ${actionText} reward for level **${level}** to role **${role.name}**.`,
    ephemeral: true
  });
}

async function handleRemoveReward(interaction) {
  const level = interaction.options.getInteger('level');

  // Check if reward exists
  const existingReward = await getRewardForLevel(interaction.guild.id, level);
  if (!existingReward) {
    return await interaction.reply({
      content: `❌ No reward found for level **${level}**.`,
      ephemeral: true
    });
  }

  // Remove reward from database
  await removeLevelReward(interaction.guild.id, level);

  await interaction.reply({
    content: `✅ Removed reward for level **${level}**.`,
    ephemeral: true
  });
}

async function handleListRewards(interaction) {
  const rewards = await getLevelRewards(interaction.guild.id);

  if (!rewards || rewards.length === 0) {
    return await interaction.reply({
      content: '📋 No level rewards configured for this server.',
      ephemeral: true
    });
  }

  let description = '';
  for (const reward of rewards) {
    const role = interaction.guild.roles.cache.get(reward.role_id);
    const roleName = role ? role.name : `Unknown Role (${reward.role_id})`;
    description += `**Level ${reward.level}:** ${roleName}\n`;
  }

  // Discord embed description limit is 4096 characters
  if (description.length > 4000) {
    description = description.substring(0, 4000) + '...\n*List truncated due to length*';
  }

  const embed = {
    title: '🏆 Level Rewards',
    description: description,
    color: 0x00ff00,
    footer: {
      text: `${rewards.length} reward${rewards.length === 1 ? '' : 's'} configured`
    },
    timestamp: new Date().toISOString()
  };

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
