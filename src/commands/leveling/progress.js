const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function calculateProgress(userData) {
  const currentLevelXp = getXpForLevel(userData.level);
  const nextLevelXp = getXpForLevel(userData.level + 1);
  const progress = ((userData.xp - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100).toFixed(2);
  const xpNeeded = nextLevelXp - userData.xp;
  
  return { progress, xpNeeded, currentLevelXp, nextLevelXp };
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
    .setName('progress')
    .setDescription('View detailed XP progress')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to check (optional)')
    ),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .eq('user_id', target.id)
        .single();

      if (!userData) {
        return await interaction.reply({
          content: `No XP data found for ${target.toString()}.`,
          ephemeral: true
        });
      }

      const { progress, xpNeeded, currentLevelXp, nextLevelXp } = calculateProgress(userData);
      const barLength = 15;
      const filledBars = Math.round((progress / 100) * barLength);
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

      const embed = new EmbedBuilder()
        .setTitle(`${target.username}'s Progress`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Current Level', value: `${userData.level}`, inline: true },
          { name: 'Total XP', value: `${userData.xp.toLocaleString()}`, inline: true },
          { name: 'Next Level', value: `${userData.level + 1}`, inline: true },
          { name: 'Progress', value: `${progressBar}\n${progress}% complete\n${xpNeeded.toLocaleString()} XP needed` },
          { name: 'Recent Activity', value: `Messages today: ${userData.daily_messages || 0}\nMessages this week: ${userData.weekly_messages || 0}` }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in progress command:', error);
      await interaction.reply({
        content: '❌ Failed to fetch progress data.',
        ephemeral: true
      });
    }
  }
};
