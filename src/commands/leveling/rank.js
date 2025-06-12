const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Displays your or another user\'s rank card')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to view rank for')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const guildId = interaction.guild.id;
      const userId = targetUser.id;

      // Get user data from database (you'll need to implement this)
      const userData = await getUserLevelData(guildId, userId);
      
      if (!userData) {
        return await interaction.reply({ 
          content: 'No XP data found for this user. Start chatting to gain XP!', 
          ephemeral: true 
        });
      }

      // Calculate XP requirements
      const currentLevelXP = getXpForLevel(userData.level);
      const nextLevelXP = getXpForLevel(userData.level + 1);
      const progressXP = userData.xp - currentLevelXP;
      const neededXP = nextLevelXP - currentLevelXP;
      const progressPercent = (progressXP / neededXP) * 100;

      // Create canvas for rank card
      const canvas = createCanvas(800, 250);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#2f3136';
      ctx.fillRect(0, 0, 800, 250);

      // User avatar
      try {
        const avatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 128 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(85, 125, 60, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 25, 65, 120, 120);
        ctx.restore();
      } catch (error) {
        console.log('Error loading avatar:', error);
        // Draw default circle if avatar fails
        ctx.fillStyle = '#7289da';
        ctx.beginPath();
        ctx.arc(85, 125, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // Username
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(targetUser.username, 170, 80);

      // Level
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#7289da';
      ctx.fillText(`Level ${userData.level}`, 170, 110);

      // XP Progress
      ctx.font = '18px Arial';
      ctx.fillStyle = '#b9bbbe';
      ctx.fillText(`${userData.xp.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`, 170, 140);

      // Progress bar background
      ctx.fillStyle = '#484b51';
      ctx.fillRect(170, 150, 400, 20);

      // Progress bar fill
      ctx.fillStyle = '#7289da';
      ctx.fillRect(170, 150, (400 * progressPercent) / 100, 20);

      // Progress percentage
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${progressPercent.toFixed(1)}%`, 580, 165);

      // Rank position
      ctx.font = '18px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rank: #${userData.rank || 'N/A'}`, 170, 195);

      // Messages count
      ctx.fillText(`Messages: ${userData.messages || 0}`, 300, 195);

      // Next milestone
      const nextMilestone = getNextMilestone(userData.level);
      if (nextMilestone) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#faa61a';
        ctx.fillText(`Next reward: Level ${nextMilestone} role`, 170, 220);
      }

      // Create attachment
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank-card.png' });
      
      await interaction.reply({ files: [attachment] });

    } catch (error) {
      console.error('Error in rank command:', error);
      await interaction.reply({ 
        content: 'An error occurred while generating your rank card. Please try again later.', 
        ephemeral: true 
      });
    }
  }
};

// Helper functions - you'll need to implement these based on your database structure
async function getUserLevelData(guildId, userId) {
  // This is a placeholder - implement your database query here
  // Should return: { level, xp, messages, rank, joinedAt }
  
  // Example return structure:
  return {
    level: 5,
    xp: 2500,
    messages: 125,
    rank: 10,
    joinedAt: Date.now()
  };
}

function getXpForLevel(level) {
  // XP calculation based on your documentation
  // Starting requirement: 50 messages for Level 1
  // Progressive multiplier: 1.05 per level
  // XP per message: 15-25 (avg 20)
  
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    const messagesNeeded = Math.round(50 * Math.pow(1.05, i - 1));
    totalXP += messagesNeeded * 20; // Average XP per message
  }
  
  return totalXP;
}

function getNextMilestone(currentLevel) {
  // Milestone levels: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100
  const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  for (const milestone of milestones) {
    if (milestone > currentLevel) {
      return milestone;
    }
  }
  
  return null; // Already at max milestone
}
