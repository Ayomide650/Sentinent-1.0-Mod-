const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateChannelXP(guildId, channelId, enabled, multiplier = 1.0) {
  try {
    const { data, error } = await supabase
      .from('xp_channels')
      .upsert({
        guild_id: guildId,
        channel_id: channelId,
        enabled: enabled,
        multiplier: multiplier,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating channel XP settings:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-channels')
    .setDescription('Manage XP settings for channels')
    .addSubcommand(sub => 
      sub.setName('enable')
        .setDescription('Enable XP gain in a channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true))
        .addNumberOption(opt => 
          opt.setName('multiplier')
            .setDescription('XP multiplier for this channel')
            .setMinValue(0.1)
            .setMaxValue(5.0)
        )
    )
    .addSubcommand(sub => 
      sub.setName('disable')
        .setDescription('Disable XP gain in a channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Target channel').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('list')
        .setDescription('List channel XP settings')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');
    const multiplier = interaction.options.getNumber('multiplier');

    try {
      if (subcommand === 'enable') {
        await updateChannelXP(interaction.guild.id, channel.id, true, multiplier);
        await interaction.reply({ content: `XP gain enabled in ${channel} with a multiplier of ${multiplier}.`, ephemeral: true });
      } else if (subcommand === 'disable') {
        await updateChannelXP(interaction.guild.id, channel.id, false);
        await interaction.reply({ content: `XP gain disabled in ${channel}.`, ephemeral: true });
      } else if (subcommand === 'list') {
        // Implement listing of channel XP settings
      }
    } catch (error) {
      await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
    }
  }
};
