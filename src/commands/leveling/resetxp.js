const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetUserXP(guildId, userId) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('guild_id', guildId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting user XP:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Reset XP for a user')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to reset XP for')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    await resetUserXP(interaction.guild.id, user.id);
    await interaction.reply({ content: `Reset XP for ${user.username}.`, ephemeral: true });
  }
};
