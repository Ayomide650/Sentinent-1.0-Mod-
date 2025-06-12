const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for all commands'),
  async execute(interaction) {
    // In DMs: show all commands. In server: show only user-available commands unless admin.
    const isDM = !interaction.guild;
    const isAdmin = interaction.memberPermissions?.has('Administrator');
    const embed = new EmbedBuilder()
      .setTitle('🤖 Advanced Discord Bot Help')
      .setDescription(isDM
        ? 'Full command reference. Use `/help` in a server for user commands.'
        : isAdmin
          ? 'Admin command reference. Regular users see only public commands.'
          : 'User command reference. For full help, DM the bot with `/help`.')
      .addFields(
        { name: 'Leveling', value: '`/rank`, `/leaderboard`, `/xp`, `/levels`, `/progress`', inline: false },
        { name: 'Moderation', value: '`/ban`, `/kick`, `/mute`, `/warn`, `/clear`, `/slowmode`, `/lock`, `/unlock`, `/lockdown`, `/nuke`, `/massban`, `/purge`, `/antilink`', inline: false },
        { name: 'Utility', value: '`/ping`, `/uptime`, `/botinfo`, `/invite`, `/support`, `/serverinfo`, `/userinfo`, `/avatar`, `/banner`, `/roles`, `/permissions`, `/whois`, `/membercount`, `/channelinfo`, `/roleinfo`, `/settings`, `/prefix`, `/autorole`', inline: false },
        { name: 'Fun', value: '`/meme`, `/joke`, `/8ball`, `/coinflip`, `/roll`, `/rps`, `/trivia`, `/riddle`, `/quote`, `/fact`, `/advice`, `/compliment`, `/roast`, `/ship`, `/ascii`, `/reverse`, `/mock`, `/zalgo`, `/choose`, `/poll`', inline: false }
      )
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
