const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function removeUserXP(guildId, userId, amount) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('xp')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    const newXp = Math.max(0, (user?.xp || 0) - amount);

    const { data, error } = await supabase
      .from('users')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        xp: newXp,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing XP:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removexp')
    .setDescription('Remove XP from a user')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to remove XP from')
        .setRequired(true)
    )
    .addIntegerOption(opt => 
      opt.setName('amount')
        .setDescription('Amount of XP to remove')
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    await removeUserXP(interaction.guild.id, user.id, amount);
    await interaction.reply({ content: `Removed ${amount} XP from ${user.username}.`, ephemeral: true });
  }
};
