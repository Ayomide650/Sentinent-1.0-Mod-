const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Database functions
async function setLevelReward(guildId, level, roleId) {
  try {
    const { data, error } = await supabase
      .from('level_rewards')
      .upsert(
        { 
          guild_id: guildId, 
          level: level, 
          role_id: roleId 
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rewards')
    .setDescription('Configure custom rewards for milestone levels (admin only)')
    .addIntegerOption(opt => 
      opt.setName('level')
        .setDescription('Milestone level')
        .setRequired(true)
        .setMinValue(1)
    )
    .addRoleOption(opt => 
      opt.setName('role')
        .setDescription('Reward role')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
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

      // Save reward to database
      await setLevelReward(interaction.guild.id, level, role.id);

      await interaction.reply({
        content: `✅ Set reward for level **${level}** to role **${role.name}**.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in level-rewards command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting the level reward.',
        ephemeral: true
      });
    }
  },

  // Export helper functions for use in leveling system
  setLevelReward,
  getLevelRewards,
  getRewardForLevel
};
