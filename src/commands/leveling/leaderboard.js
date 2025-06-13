const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getLeaderboard(guildId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('guild_id', guildId)
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server XP leaderboard')
    .addIntegerOption(opt => 
      opt.setName('page')
        .setDescription('Page number')
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return await interaction.reply({
        content: '❌ Database configuration is missing.',
        ephemeral: true
      });
    }

    try {
      const page = interaction.options.getInteger('page') || 1;
      const users = await getLeaderboard(interaction.guild.id, page);

      if (!users.length) {
        return await interaction.reply({
          content: page > 1 ? '📋 No more users to show.' : '📋 No XP data found.',
          ephemeral: true
        });
      }

      let description = '';
      for (let i = 0; i < users.length; i++) {
        const rank = (page - 1) * 10 + i + 1;
        const member = await interaction.guild.members.fetch(users[i].user_id).catch(() => null);
        const username = member ? member.user.username : 'Unknown User';
        description += `**${rank}.** ${username}\n`;
        description += `Level ${users[i].level} • ${users[i].xp.toLocaleString()} XP\n\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 XP Leaderboard')
        .setDescription(description)
        .setColor(0x00ff00)
        .setFooter({ text: `Page ${page}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in leaderboard command:', error);
      await interaction.reply({
        content: '❌ Failed to fetch leaderboard.',
        ephemeral: true
      });
    }
  }
};
