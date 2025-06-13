const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weeklylb')
    .setDescription('View weekly XP leaderboard'),

  async execute(interaction) {
    // Fetch weekly leaderboard data from Supabase
    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select('username, weeklyXp, level')
      .eq('guildId', interaction.guild.id)
      .order('weeklyXp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return interaction.reply({ content: 'Error fetching leaderboard data.', ephemeral: true });
    }

    if (!leaderboard.length) {
      return interaction.reply({ content: 'No weekly data found.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Weekly XP Leaderboard')
      .setColor(0x7289da);

    leaderboard.forEach((entry, i) => {
      embed.addFields({
        name: `#${i + 1} ${entry.username}`,
        value: `XP Gained: ${entry.weeklyXp} | Level: ${entry.level}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
