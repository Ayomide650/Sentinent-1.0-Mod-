const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase configuration missing in xp command');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database functions
async function getUserXP(guildId, userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting user XP:', error);
    return null;
  }
}

async function getUserRank(guildId, xp) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('guild_id', guildId)
      .gt('xp', xp);
    
    if (error) throw error;
    return (data?.length || 0) + 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
}

function getXpForLevel(level) {
  if (level <= 1) return 0;
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.round(20 * 50 * Math.pow(1.05, i - 1));
  }
  return xp;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('View detailed XP information')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to check XP for')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return await interaction.reply({
        content: '❌ Database configuration is missing. Please contact the server administrator.',
        ephemeral: true
      });
    }

    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const userData = await getUserXP(interaction.guild.id, target.id);

      if (!userData) {
        return await interaction.reply({
          content: `No XP data found for ${target.toString()}.`,
          ephemeral: true
        });
      }

      // Calculate XP details
      const currentLevelXp = getXpForLevel(userData.level);
      const nextLevelXp = getXpForLevel(userData.level + 1);
      const xpNeeded = nextLevelXp - userData.xp;
      const progress = ((userData.xp - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100).toFixed(2);
      const rank = await getUserRank(interaction.guild.id, userData.xp);

      // Create progress bar
      const barLength = 15;
      const filledBars = Math.round((progress / 100) * barLength);
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

      const embed = new EmbedBuilder()
        .setTitle(`${target.username}'s XP Stats`)
        .setColor(0x43b581)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Level', value: `${userData.level}`, inline: true },
          { name: 'Rank', value: `#${rank}`, inline: true },
          { name: 'Total XP', value: `${userData.xp.toLocaleString()}`, inline: true },
          { name: 'Messages', value: `${userData.messages?.toLocaleString() || '0'}`, inline: true },
          { name: 'Member Since', value: `<t:${Math.floor(userData.created_at ? new Date(userData.created_at).getTime() / 1000 : Date.now() / 1000)}:R>`, inline: true },
          { name: `Level Progress - ${progress}%`, value: `${progressBar}\n${userData.xp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP\n${xpNeeded.toLocaleString()} XP needed for next level` }
        )
        .setFooter({ text: 'XP updates every minute' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in xp command:', error);
      const errorMessage = {
        content: '❌ An error occurred while fetching XP data.',
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
