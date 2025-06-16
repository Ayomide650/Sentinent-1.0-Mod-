const { EmbedBuilder } = require('discord.js');
const supabase = require('../../database/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const guildId = member.guild.id;
      
      // Get welcome configuration from database
      const { data: welcomeConfig, error } = await supabase
        .from('welcome_config')
        .select('*')
        .eq('guild_id', guildId)
        .eq('enabled', true)
        .single();
      
      if (error || !welcomeConfig) {
        // No welcome system configured or disabled
        return;
      }
      
      // Get the welcome channel
      const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.channel_id);
      if (!welcomeChannel) {
        console.error(`Welcome channel not found: ${welcomeConfig.channel_id}`);
        return;
      }
      
      // Check if bot has permissions
      const botMember = member.guild.members.me;
      const permissions = welcomeChannel.permissionsFor(botMember);
      if (!permissions.has(['ViewChannel', 'SendMessages'])) {
        console.error(`Bot lacks permissions in welcome channel: ${welcomeConfig.channel_id}`);
        return;
      }
      
      // Replace placeholders in welcome message
      const welcomeMessage = welcomeConfig.welcome_message
        .replace(/{user}/g, member.toString())
        .replace(/{server}/g, member.guild.name)
        .replace(/{memberCount}/g, member.guild.memberCount.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{mention}/g, member.toString())
        .replace(/{tag}/g, member.user.tag);
      
      // Create welcome embed (optional - you can choose to send plain text or embed)
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎉 Welcome to the server!')
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields([
          {
            name: '👤 Member Info',
            value: `**Username:** ${member.user.username}\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Member #${member.guild.memberCount}**`,
            inline: true
          }
        ])
        .setTimestamp()
        .setFooter({ 
          text: `Welcome to ${member.guild.name}!`, 
          iconURL: member.guild.iconURL({ dynamic: true }) 
        });
      
      // Send welcome message
      // You can choose between these options:
      
      // Option 1: Send as embed (recommended)
      await welcomeChannel.send({ 
        content: member.toString(), // Mention the user
        embeds: [welcomeEmbed] 
      });
      
      // Option 2: Send as plain text (uncomment if you prefer this)
      // await welcomeChannel.send(welcomeMessage);
      
      // Optional: Log the welcome message
      console.log(`Welcome message sent for ${member.user.tag} in ${member.guild.name}`);
      
      // Optional: Add user to database for tracking
      try {
        await supabase
          .from('user_joins')
          .insert({
            user_id: member.id,
            guild_id: guildId,
            joined_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('Error logging user join:', dbError);
        // Don't fail the welcome message if logging fails
      }
      
    } catch (error) {
      console.error('Error in guildMemberAdd event:', error);
    }
  }
};
