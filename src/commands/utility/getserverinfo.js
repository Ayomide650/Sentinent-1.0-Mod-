const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getserverinfo')
        .setDescription('Get essential server information for new users')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const guild = interaction.guild;

            if (!guild) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Fetch owner and members
            const owner = await guild.fetchOwner();
            await guild.members.fetch();

            // Generate comprehensive text output
            let output = `
═══════════════════════════════════════
🏰 ${guild.name.toUpperCase()} - SERVER INFORMATION
═══════════════════════════════════════

📋 BASIC INFO:
• Server Name: ${guild.name}
• Server ID: ${guild.id}
• Owner: ${owner.user.tag} (${owner.user.id})
• Created: ${guild.createdAt.toDateString()}
• Members: ${guild.memberCount}
• Boost Level: ${guild.premiumTier}
• Boost Count: ${guild.premiumSubscriptionCount || 0}

📝 DESCRIPTION:
${guild.description || 'No server description set'}

🔗 SERVER LINKS:
• Server Icon: ${guild.iconURL({ dynamic: true, size: 512 }) || 'No icon set'}
• Server Banner: ${guild.bannerURL({ dynamic: true, size: 1024 }) || 'No banner set'}
• Splash Screen: ${guild.splashURL({ dynamic: true, size: 1024 }) || 'No splash screen'}
${guild.vanityURLCode ? `• Vanity URL: discord.gg/${guild.vanityURLCode}` : ''}

📺 CHANNELS (${guild.channels.cache.size} total):
`;

            // Get channels organized by category
            const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
            const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
            const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
            const announcements = guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement);

            // Important channels first
            if (guild.systemChannel) {
                output += `• 🏠 Welcome Channel: #${guild.systemChannel.name}\n`;
            }
            if (guild.rulesChannel) {
                output += `• 📋 Rules Channel: #${guild.rulesChannel.name}\n`;
            }
            if (guild.publicUpdatesChannel) {
                output += `• 📰 Updates Channel: #${guild.publicUpdatesChannel.name}\n`;
            }

            // Categories and their channels
            if (categories.size > 0) {
                categories.forEach(category => {
                    output += `\n📁 ${category.name.toUpperCase()}:\n`;
                    const categoryChannels = guild.channels.cache.filter(c => c.parentId === category.id);
                    categoryChannels.forEach(channel => {
                        const emoji = channel.type === ChannelType.GuildText ? '💬' : 
                                     channel.type === ChannelType.GuildVoice ? '🔊' : 
                                     channel.type === ChannelType.GuildAnnouncement ? '📢' : '📺';
                        output += `  ${emoji} ${channel.name}${channel.topic ? ` - ${channel.topic}` : ''}\n`;
                    });
                });
            }

            // Channels without category
            const uncategorized = guild.channels.cache.filter(c => 
                !c.parentId && 
                c.type !== ChannelType.GuildCategory && 
                c.id !== guild.systemChannelId && 
                c.id !== guild.rulesChannelId && 
                c.id !== guild.publicUpdatesChannelId
            );

            if (uncategorized.size > 0) {
                output += `\n📺 OTHER CHANNELS:\n`;
                uncategorized.forEach(channel => {
                    const emoji = channel.type === ChannelType.GuildText ? '💬' : 
                                 channel.type === ChannelType.GuildVoice ? '🔊' : 
                                 channel.type === ChannelType.GuildAnnouncement ? '📢' : '📺';
                    output += `• ${emoji} ${channel.name}${channel.topic ? ` - ${channel.topic}` : ''}\n`;
                });
            }

            // Roles section
            const roles = guild.roles.cache.sort((a, b) => b.position - a.position);
            const importantRoles = roles.filter(r => r.name !== '@everyone' && (r.hoist || r.mentionable || r.permissions.has('Administrator')));

            output += `\n🎭 ROLES (${roles.size} total):`;
            
            if (importantRoles.size > 0) {
                importantRoles.forEach(role => {
                    const color = role.hexColor !== '#000000' ? ` (${role.hexColor})` : '';
                    const badges = [];
                    if (role.hoist) badges.push('Displayed');
                    if (role.mentionable) badges.push('Mentionable');
                    if (role.permissions.has('Administrator')) badges.push('Admin');
                    
                    output += `\n• ${role.name}${color}${badges.length > 0 ? ` [${badges.join(', ')}]` : ''}`;
                });
            }

            // Member stats
            const members = guild.members.cache;
            const humans = members.filter(m => !m.user.bot);
            const bots = members.filter(m => m.user.bot);
            const online = members.filter(m => m.presence?.status === 'online');

            output += `\n\n👥 MEMBER STATISTICS:
• Total Members: ${guild.memberCount}
• Humans: ${humans.size}
• Bots: ${bots.size}
• Currently Online: ${online.size}
• Recent Joins (7 days): ${members.filter(m => Date.now() - m.joinedTimestamp < 7 * 24 * 60 * 60 * 1000).size}

🛡️ SECURITY SETTINGS:
• Verification Level: ${getVerificationLevel(guild.verificationLevel)}
• Content Filter: ${getContentFilter(guild.explicitContentFilter)}
• 2FA Required: ${guild.mfaLevel ? 'Yes' : 'No'}

✨ SERVER FEATURES:`;

            if (guild.features.length > 0) {
                guild.features.forEach(feature => {
                    output += `\n• ${formatFeature(feature)}`;
                });
            } else {
                output += '\n• No special features enabled';
            }

            // Emojis
            const customEmojis = guild.emojis.cache;
            if (customEmojis.size > 0) {
                output += `\n\n😀 CUSTOM EMOJIS (${customEmojis.size}):`;
                const emojiNames = customEmojis.map(e => e.name).slice(0, 20); // First 20
                output += `\n${emojiNames.join(', ')}`;
                if (customEmojis.size > 20) {
                    output += `\n... and ${customEmojis.size - 20} more`;
                }
            }

            output += `\n\n═══════════════════════════════════════
✅ DATA EXPORTED SUCCESSFULLY
Copy this text to use in your website!
═══════════════════════════════════════`;

            // Send as code block for easy copying
            const chunks = splitMessage(output, 1900); // Discord limit is 2000, leaving room for code blocks

            await interaction.editReply({
                content: '📋 **Server information exported! Copy the text below:**',
            });

            for (let i = 0; i < chunks.length; i++) {
                await interaction.followUp({
                    content: `\`\`\`\n${chunks[i]}\`\`\``,
                    ephemeral: false
                });
            }

            // Also send server images as separate message
            const imageEmbed = new EmbedBuilder()
                .setTitle('🖼️ Server Images for Download')
                .setColor('#5865F2');

            if (guild.iconURL()) {
                imageEmbed.addFields({ name: '📱 Server Icon', value: `[Download](${guild.iconURL({ dynamic: true, size: 512 })})`, inline: true });
                imageEmbed.setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));
            }

            if (guild.bannerURL()) {
                imageEmbed.addFields({ name: '🎨 Server Banner', value: `[Download](${guild.bannerURL({ dynamic: true, size: 1024 })})`, inline: true });
                imageEmbed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }

            if (guild.splashURL()) {
                imageEmbed.addFields({ name: '💫 Splash Screen', value: `[Download](${guild.splashURL({ dynamic: true, size: 1024 })})`, inline: true });
            }

            if (guild.iconURL() || guild.bannerURL() || guild.splashURL()) {
                await interaction.followUp({ embeds: [imageEmbed] });
            }

        } catch (error) {
            console.error('Error in getserverinfo command:', error);
            
            const errorMessage = '❌ An error occurred while exporting server information.';
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    }
};

// Helper functions
function splitMessage(text, maxLength) {
    const chunks = [];
    let currentChunk = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

function getVerificationLevel(level) {
    const levels = {
        0: 'None - No restrictions',
        1: 'Low - Must have verified email',
        2: 'Medium - Must be registered on Discord for 5+ minutes',
        3: 'High - Must be in server for 10+ minutes',
        4: 'Very High - Must have verified phone number'
    };
    return levels[level] || 'Unknown';
}

function getContentFilter(filter) {
    const filters = {
        0: 'Disabled - No filtering',
        1: 'Members without roles - Filter for members without roles',
        2: 'All members - Filter for all members'
    };
    return filters[filter] || 'Unknown';
}

function formatFeature(feature) {
    return feature.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}
