const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetServerXP(guildId) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('guild_id', guildId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting server XP:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetserver')
    .setDescription('Reset all XP data for the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.reply({ content: 'Are you sure you want to reset all XP data for the server? This action is irreversible.', ephemeral: true });
      
      // Await confirmation
      const filter = i => i.customId === 'confirm_reset' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', async i => {
        if (i.customId === 'confirm_reset') {
          await resetServerXP(interaction.guild.id);
          await i.update({ content: 'All server XP data has been reset.', ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({ content: 'No confirmation received, action cancelled.', ephemeral: true });
        }
      });
    } catch (error) {
      console.error('Error in resetserver command:', error);
      await interaction.reply({ content: 'There was an error trying to execute that command!', ephemeral: true });
    }
  }
};
