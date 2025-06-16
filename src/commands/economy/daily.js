const { SlashCommandBuilder } = require('discord.js');
const { updateUserCoins } = require('../../utils/coinUtils');
const { pool } = require('../../database/connection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins'),
    
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Check if user exists in database
            let result = await pool.query(
                'SELECT last_daily FROM user_coins WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            
            // If user doesn't exist, create them
            if (result.rows.length === 0) {
                await pool.query(
                    'INSERT INTO user_coins (user_id, guild_id, coins, last_daily) VALUES ($1, $2, 0, NULL)',
                    [userId, guildId]
                );
                result = await pool.query(
                    'SELECT last_daily FROM user_coins WHERE user_id = $1 AND guild_id = $2',
                    [userId, guildId]
                );
            }
            
            const now = new Date();
            const today = new Date(now);
            today.setHours(4, 0, 0, 0); // Today's 4:00 AM WAT
            
            // If current time is before 4 AM, check against yesterday's 4 AM
            if (now.getHours() < 4) {
                today.setDate(today.getDate() - 1);
            }
            
            // Check if user has already claimed today
            if (result.rows[0]?.last_daily) {
                const lastDaily = new Date(result.rows[0].last_daily);
                
                // If last claim was after today's reset time, they've already claimed
                if (lastDaily > today) {
                    const nextResetTime = new Date(today);
                    nextResetTime.setDate(nextResetTime.getDate() + 1);
                    
                    return interaction.reply({
                        content: `You've already claimed your daily coins! Next claim available at 4:00 AM WAT (${nextResetTime.toLocaleString('en-US', { timeZone: 'Africa/Lagos' })})`,
                        ephemeral: true
                    });
                }
            }
            
            // Award 500 coins (as requested)
            await updateUserCoins(userId, 500);
            
            // Update last_daily timestamp
            await pool.query(
                'UPDATE user_coins SET last_daily = NOW() WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            
            await interaction.reply({
                content: '🎉 You\'ve claimed your daily 500 coins!',
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error in daily command:', error);
            await interaction.reply({
                content: 'An error occurred while processing your daily claim. Please try again later.',
                ephemeral: true
            });
        }
    }
};
