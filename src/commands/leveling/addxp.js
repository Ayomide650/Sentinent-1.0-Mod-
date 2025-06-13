const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addUserXP(guildId, userId, xpAmount) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('xp, level')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    const newXp = (existingUser?.xp || 0) + xpAmount;
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
    console.error('Error adding XP:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('Add XP to a user (Admin only)')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to add XP to')
        .setRequired(true)
    )
    .addIntegerOption(opt => 
      opt.setName('amount')
        .setDescription('Amount of XP to add')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return await interaction.reply({
        content: '❌ Database configuration is missing.',
        ephemeral: true
      });
    }

    try {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      await addUserXP(interaction.guild.id, user.id, amount);

      await interaction.reply({
        content: `✅ Added ${amount} XP to ${user.toString()}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in addxp command:', error);
      await interaction.reply({
        content: '❌ Failed to add XP.',
        ephemeral: true
      });
    }
  }
};
