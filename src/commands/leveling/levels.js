const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('View all milestone levels and their rewards'),

  async execute(interaction) {
    try {
      const rewards = await getLevelRewards(interaction.guild.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🎯 Level Milestones')
        .setColor(0x43b581)
        .setDescription('Progress through levels to earn special roles!');

      // Group rewards by tier
      const tiers = [
        { name: 'Beginner (1-20)', levels: [] },
        { name: 'Intermediate (21-50)', levels: [] },
        { name: 'Advanced (51-80)', levels: [] },
        { name: 'Expert (81-100)', levels: [] }
      ];

      rewards.forEach(reward => {
        const role = interaction.guild.roles.cache.get(reward.role_id);
        const level = reward.level;
        const tierIndex = 
          level <= 20 ? 0 :
          level <= 50 ? 1 :
          level <= 80 ? 2 : 3;
        
        tiers[tierIndex].levels.push(`Level ${level}: ${role ? role.name : 'Unknown Role'}`);
      });

      // Add non-empty tiers to embed
      tiers.forEach(tier => {
        if (tier.levels.length > 0) {
          embed.addFields({
            name: tier.name,
            value: tier.levels.join('\n') || 'No rewards set',
            inline: false
          });
        }
      });

      embed.setFooter({ 
        text: `Total Rewards: ${rewards.length} • Use /level to check your progress` 
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in levels command:', error);
      await interaction.reply({
        content: '❌ Failed to fetch level information.',
        ephemeral: true
      });
    }
  }
};
