const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('website')
    .setDescription('Get the link to our server website'),
  
  cooldown: 5, // 5 second cooldown
  
  async execute(interaction) {
    try {
      // Create an embed for a more professional look
      const websiteEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🌐 Server Website')
        .setDescription('Visit our official server website!')
        .addFields([
          {
            name: '🔗 Website Link',
            value: '[Go to server Website](https://firekid-project.vercel.app)',
            inline: false
          },
          {
            name: '📋 What you can find:',
            value: '• Server information\n• Community updates\n• Resources and guides\n• And much more!',
            inline: false
          }
        ])
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
        });

      await interaction.reply({
        embeds: [websiteEmbed],
        ephemeral: false // Make it visible to everyone
      });

      console.log(`✅ ${interaction.user.tag} used /website command`);

    } catch (error) {
      console.error('Website command error:', error);
      
      // Fallback to simple text message if embed fails
      try {
        await interaction.reply({
          content: '🌐 **Server Website**\n\n🔗 [Go to server Website](https://firekid-project.vercel.app)\n\nVisit our website for server information and community updates!',
          ephemeral: false
        });
      } catch (fallbackError) {
        console.error('Website command fallback error:', fallbackError);
        await interaction.reply({
          content: '❌ An error occurred while getting the website link. Please try again.',
          ephemeral: true
        });
      }
    }
  }
};
