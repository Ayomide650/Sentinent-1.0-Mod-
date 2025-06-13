const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getMonthlyLeaderboard(guildId, page = 1, limit = 10) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const offset = (page - 1) * limit;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('guild_id', guildId)
      .gte('updated_at', firstDayOfMonth)
      .order('monthly_xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monthlylb')
    .setDescription('Shows the monthly XP leaderboard')
    .addIntegerOption(opt => 
      opt.setName('page')
        .setDescription('Page number')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const page = interaction.options.getInteger('page') || 1;
    const leaderboard = await getMonthlyLeaderboard(interaction.guild.id, page);

    if (!leaderboard.length) return interaction.reply({ content: 'No monthly data found.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Monthly XP Leaderboard')
      .setColor(0xf1c40f);

    leaderboard.forEach((entry, i) => {
      embed.addFields({
        name: `#${i + 1} ${entry.username}`,
        value: `XP Gained: ${entry.monthly_xp} | Level: ${entry.level}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
