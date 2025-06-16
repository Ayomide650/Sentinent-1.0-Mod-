const { SlashCommandBuilder } = require('discord.js');
const { updateUserCoins } = require('../../utils/coinUtils');
const { pool } = require('../../database/connection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;
        
        if (!guildId) {
            return interaction.reply({
                content: 'This command can only be used in a server!',
                ephemeral: true
            });
        }
        
        try {
            // Check if user exists and get last_daily
            const userCheck = await pool.query(
                'SELECT last_daily FROM user_coins WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            
            // Create user if they don't exist
            if (userCheck.rows.length === 0) {
                await pool.query(
                    'INSERT INTO user_coins (user_id, guild_id, coins, last_daily) VALUES ($1, $2, 0, NULL)',
                    [userId, guildId]
                );
            }
            
            // Get current time and today's reset time (4 AM WAT)
            const now = new Date();
            const today = new Date();
            today.setHours(4, 0, 0, 0); // 4:00 AM today
            
            // If it's before 4 AM, use yesterday's 4 AM as the reset point
            if (now.getHours() < 4) {
                today.setDate(today.getDate() - 1);
            }
            
            // Check if user has already claimed today
            if (userCheck.rows.length > 0 && userCheck.rows[0].last_daily) {
                const lastDaily = new Date(userCheck.rows[0].last_daily);
                
                if (lastDaily > today) {
                    return interaction.reply({
                        content: 'You\'ve already claimed your daily coins! Try again after 4:00 AM WAT.',
                        ephemeral: true
                    });
                }
            }
            
            // Give 500 coins
            await updateUserCoins(userId, 500);
            
            // Update last_daily timestamp
            await pool.query(
                'UPDATE user_coins SET last_daily = NOW() WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            
            return interaction.reply({
                content: '🎉 You\'ve claimed your daily 500 coins!',
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error in daily command:', error);
            return interaction.reply({
                content: 'Something went wrong while claiming your daily coins. Please try again!',
                ephemeral: true
            });
        }
    }
};
