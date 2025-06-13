const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getXpForLevel(level) {
  // ...XP calculation logic from xpCalculator.js...
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('Set a user\'s level')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to set level for')
        .setRequired(true)
    )
    .addIntegerOption(opt => 
      opt.setName('level')
        .setDescription('New level')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const level = interaction.options.getInteger('level');

    // Update the user's level in the database
    const { data, error } = await supabase
      .from('levels')
      .upsert([
        {
          guild_id: interaction.guild.id,
          user_id: user.id,
          level: level,
          xp: getXpForLevel(level), // Calculate XP based on the new level
        },
      ]);

    if (error) {
      console.error('Error updating level:', error);
      return interaction.reply({ content: 'There was an error setting the level. Please try again later.', ephemeral: true });
    }

    // Optionally, update the user's roles based on the new level
    const member = await interaction.guild.members.fetch(user.id);
    // ...role updating logic...

    await interaction.reply({ content: `Set ${user.username}'s level to ${level}.`, ephemeral: true });
  }
};
