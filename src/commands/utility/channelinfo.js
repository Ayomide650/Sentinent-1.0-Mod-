const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Show detailed information about a channel')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to show information about')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      
      // Check if the channel exists and is accessible
      if (!channel) {
        return await interaction.reply({ 
          content: '❌ Channel not found or not accessible.', 
          ephemeral: true 
        });
      }

      // Get channel type string
      const getChannelTypeString = (type) => {
        const types = {
          [ChannelType.GuildText]: '📝 Text Channel',
          [ChannelType.GuildVoice]: '🔊 Voice Channel',
          [ChannelType.GuildCategory]: '📁 Category',
          [ChannelType.GuildAnnouncement]: '📢 Announcement Channel',
          [ChannelType.AnnouncementThread]: '🧵 Announcement Thread',
          [ChannelType.PublicThread]: '🧵 Public Thread',
          [ChannelType.PrivateThread]: '🧵 Private Thread',
          [ChannelType.GuildStageVoice]: '🎭 Stage Channel',
          [ChannelType.GuildForum]: '💬 Forum Channel',
          [ChannelType.GuildMedia]: '🎬 Media Channel'
        };
        return types[type] || `Unknown (${type})`;
      };

      const embed = new EmbedBuilder()
        .setTitle(`📊 Channel Information`)
        .setDescription(`**${channel.name ? `#${channel.name}` : 'Unnamed Channel'}**`)
        .addFields(
          { 
            name: '🆔 Channel ID', 
            value: `\`${channel.id}\``, 
            inline: true 
          },
          { 
            name: '📋 Type', 
            value: getChannelTypeString(channel.type), 
            inline: true 
          },
          { 
            name: '📅 Created', 
            value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>\n<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, 
            inline: true 
          }
        )
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      // Add channel-specific information
      if (channel.topic) {
        embed.addFields({ 
          name: '📝 Topic', 
          value: channel.topic.length > 1024 ? channel.topic.substring(0, 1021) + '...' : channel.topic, 
          inline: false 
        });
      }

      if (channel.parent) {
        embed.addFields({ 
          name: '📁 Category', 
          value: channel.parent.name, 
          inline: true 
        });
      }

      // Voice channel specific info
      if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
        embed.addFields(
          { 
            name: '👥 User Limit', 
            value: channel.userLimit === 0 ? 'Unlimited' : channel.userLimit.toString(), 
            inline: true 
          },
          { 
            name: '🎵 Bitrate', 
            value: `${channel.bitrate / 1000}kbps`, 
            inline: true 
          }
        );

        if (channel.members && channel.members.size > 0) {
          embed.addFields({ 
            name: '🔊 Currently Connected', 
            value: `${channel.members.size} member(s)`, 
            inline: true 
          });
        }
      }

      // Text channel specific info
      if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
        if (channel.rateLimitPerUser > 0) {
          embed.addFields({ 
            name: '⏱️ Slowmode', 
            value: `${channel.rateLimitPerUser} second(s)`, 
            inline: true 
          });
        }

        embed.addFields({ 
          name: '🔞 NSFW', 
          value: channel.nsfw ? 'Yes' : 'No', 
          inline: true 
        });
      }

      // Thread specific info
      if (channel.isThread && channel.isThread()) {
        embed.addFields(
          { 
            name: '🧵 Parent Channel', 
            value: `<#${channel.parentId}>`, 
            inline: true 
          },
          { 
            name: '🔒 Archived', 
            value: channel.archived ? 'Yes' : 'No', 
            inline: true 
          }
        );

        if (channel.ownerId) {
          embed.addFields({ 
            name: '👤 Thread Owner', 
            value: `<@${channel.ownerId}>`, 
            inline: true 
          });
        }
      }

      // Position info (for non-thread channels)
      if (!channel.isThread || !channel.isThread()) {
        embed.addFields({ 
          name: '📍 Position', 
          value: channel.position?.toString() || 'N/A', 
          inline: true 
        });
      }

      // Permission info
      if (channel.permissionsFor && interaction.member) {
        const userPerms = channel.permissionsFor(interaction.member);
        const canView = userPerms.has(PermissionFlagsBits.ViewChannel);
        const canSend = userPerms.has(PermissionFlagsBits.SendMessages);
        const canManage = userPerms.has(PermissionFlagsBits.ManageChannels);

        embed.addFields({ 
          name: '🔐 Your Permissions', 
          value: `View: ${canView ? '✅' : '❌'} | Send: ${canSend ? '✅' : '❌'} | Manage: ${canManage ? '✅' : '❌'}`, 
          inline: false 
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in channelinfo command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while fetching channel information.')
        .setColor(0xFF0000);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
