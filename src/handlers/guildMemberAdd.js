// welcome.js - Updated with better error handling
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const supabase = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome system')
    .addChannelOption(opt => 
      opt.setName('channel')
         .setDescription('Welcome channel')
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(opt => 
      opt.setName('message')
         .setDescription('Welcome message (use {user}, {server}, {memberCount} placeholders)')
         .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      const guildId = interaction.guild.id;

      // Validate channel type
      if (channel.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: '❌ Please select a text channel only.',
          ephemeral: true
        });
      }

      // Check if bot has permissions in the selected channel
      const botMember = interaction.guild.members.me;
      const permissions = channel.permissionsFor(botMember);
      
      if (!permissions.has(['ViewChannel', 'SendMessages'])) {
        return await interaction.reply({
          content: '❌ I don\'t have permission to send messages in that channel.',
          ephemeral: true
        });
      }

      // Save/update welcome configuration in database
      const { data, error } = await supabase
        .from('welcome_config')
        .upsert({
          guild_id: guildId,
          channel_id: channel.id,
          welcome_message: message,
          enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'guild_id'
        });

      if (error) {
        console.error('Database error:', error);
        return await interaction.reply({
          content: '❌ Failed to save welcome configuration. Please try again.',
          ephemeral: true
        });
      }

      // Log successful configuration
      console.log(`Welcome system configured for guild ${guildId}:`, {
        channel: channel.name,
        channelId: channel.id,
        message: message.substring(0, 50) + '...'
      });

      // Send success message with preview
      const previewMessage = message
        .replace(/{user}/g, interaction.user.toString())
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount.toString());

      await interaction.reply({
        embeds: [{
          color: 0x00ff00,
          title: '✅ Welcome System Configured',
          fields: [
            {
              name: 'Channel',
              value: channel.toString(),
              inline: true
            },
            {
              name: 'Status',
              value: 'Enabled',
              inline: true
            },
            {
              name: 'Message Preview',
              value: previewMessage.length > 1000 ? previewMessage.substring(0, 997) + '...' : previewMessage,
              inline: false
            }
          ],
          footer: {
            text: 'Use placeholders: {user}, {server}, {memberCount}'
          }
        }],
        ephemeral: true
      });

    } catch (error) {
      console.error('Welcome command error:', error);
      await interaction.reply({
        content: '❌ An error occurred while configuring the welcome system.',
        ephemeral: true
      });
    }
  }
};

// guildMemberAdd.js - Updated with extensive debugging
const { EmbedBuilder } = require('discord.js');
const supabase = require('../../database/database');

// Make sure this event is properly exported and has the correct structure

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      console.log(`🔍 New member joined: ${member.user.tag} in ${member.guild.name}`);
      
      const guildId = member.guild.id;
      
      // Get welcome configuration from database
      console.log(`📊 Fetching welcome config for guild: ${guildId}`);
      const { data: welcomeConfig, error } = await supabase
        .from('welcome_config')
        .select('*')
        .eq('guild_id', guildId)
        .eq('enabled', true)
        .single();
      
      if (error) {
        console.log(`❌ Database error fetching welcome config:`, error);
        return;
      }
      
      if (!welcomeConfig) {
        console.log(`⚠️ No welcome system configured for guild: ${guildId}`);
        return;
      }
      
      console.log(`✅ Welcome config found:`, {
        channelId: welcomeConfig.channel_id,
        enabled: welcomeConfig.enabled,
        messageLength: welcomeConfig.welcome_message.length
      });
      
      // Get the welcome channel
      const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.channel_id);
      if (!welcomeChannel) {
        console.error(`❌ Welcome channel not found: ${welcomeConfig.channel_id}`);
        
        // Try to disable the config if channel doesn't exist
        await supabase
          .from('welcome_config')
          .update({ enabled: false })
          .eq('guild_id', guildId);
        
        return;
      }
      
      console.log(`✅ Welcome channel found: ${welcomeChannel.name}`);
      
      // Check if bot has permissions
      const botMember = member.guild.members.me;
      const permissions = welcomeChannel.permissionsFor(botMember);
      
      console.log(`🔐 Bot permissions in channel:`, {
        ViewChannel: permissions.has('ViewChannel'),
        SendMessages: permissions.has('SendMessages'),
        EmbedLinks: permissions.has('EmbedLinks')
      });
      
      if (!permissions.has(['ViewChannel', 'SendMessages'])) {
        console.error(`❌ Bot lacks permissions in welcome channel: ${welcomeConfig.channel_id}`);
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
      
      console.log(`📝 Processed welcome message (first 100 chars): ${welcomeMessage.substring(0, 100)}...`);
      
      // Create welcome embed
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
      console.log(`📤 Attempting to send welcome message...`);
      
      const sentMessage = await welcomeChannel.send({ 
        content: member.toString(), // Mention the user
        embeds: [welcomeEmbed] 
      });
      
      console.log(`✅ Welcome message sent successfully! Message ID: ${sentMessage.id}`);
      
      // Optional: Log the user join to database
      try {
        await supabase
          .from('user_joins')
          .insert({
            user_id: member.id,
            guild_id: guildId,
            joined_at: new Date().toISOString()
          });
        console.log(`📊 User join logged to database`);
      } catch (dbError) {
        console.error('⚠️ Error logging user join (non-critical):', dbError);
      }
      
    } catch (error) {
      console.error('❌ Error in guildMemberAdd event:', error);
      
      // Try to send a simple fallback message if embed fails
      try {
        const welcomeChannel = member.guild.channels.cache.get(welcomeConfig?.channel_id);
        if (welcomeChannel) {
          await welcomeChannel.send(`Welcome ${member.toString()}! 🎉`);
          console.log(`✅ Fallback welcome message sent`);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback message also failed:', fallbackError);
      }
    }
  }
};

// Additional debugging command - Add this as a separate file: testWelcome.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Test the welcome system by simulating your join')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const guildId = interaction.guild.id;
      
      // Get welcome configuration
      const { data: welcomeConfig, error } = await supabase
        .from('welcome_config')
        .select('*')
        .eq('guild_id', guildId)
        .eq('enabled', true)
        .single();
      
      if (error || !welcomeConfig) {
        return await interaction.editReply({
          content: '❌ No welcome system configured for this server. Use `/welcome` first.'
        });
      }
      
      // Get the welcome channel
      const welcomeChannel = interaction.guild.channels.cache.get(welcomeConfig.channel_id);
      if (!welcomeChannel) {
        return await interaction.editReply({
          content: '❌ Welcome channel not found. Please reconfigure the welcome system.'
        });
      }
      
      // Check permissions
      const botMember = interaction.guild.members.me;
      const permissions = welcomeChannel.permissionsFor(botMember);
      
      if (!permissions.has(['ViewChannel', 'SendMessages'])) {
        return await interaction.editReply({
          content: '❌ Bot lacks permissions in the welcome channel.'
        });
      }
      
      // Simulate the welcome message
      const welcomeMessage = welcomeConfig.welcome_message
        .replace(/{user}/g, interaction.user.toString())
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount.toString())
        .replace(/{username}/g, interaction.user.username)
        .replace(/{mention}/g, interaction.user.toString())
        .replace(/{tag}/g, interaction.user.tag);
      
      const { EmbedBuilder } = require('discord.js');
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🧪 Welcome Test - This is a simulation!')
        .setDescription(welcomeMessage)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields([
          {
            name: '👤 Member Info',
            value: `**Username:** ${interaction.user.username}\n**Account Created:** <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:R>`,
            inline: true
          }
        ])
        .setTimestamp()
        .setFooter({ 
          text: `Test for ${interaction.guild.name}`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
        });
      
      await welcomeChannel.send({ 
        content: `🧪 **Welcome Test** - ${interaction.user.toString()}`, 
        embeds: [welcomeEmbed] 
      });
      
      await interaction.editReply({
        content: `✅ Welcome test sent to ${welcomeChannel.toString()}!`
      });
      
    } catch (error) {
      console.error('Test welcome command error:', error);
      await interaction.editReply({
        content: '❌ An error occurred while testing the welcome system.'
      });
    }
  }
};
