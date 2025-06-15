const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../database/connection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the weekly leaderboard'),

    async execute(interaction) {
        const topUsers = await pool.query(
            `SELECT u.user_id, SUM(g.amount_won) as total_won 
             FROM game_history g 
             JOIN user_coins u ON g.user_id = u.user_id 
             WHERE g.played_at > NOW() - INTERVAL '7 days'
             GROUP BY u.user_id 
             ORDER BY total_won DESC 
             LIMIT 5`
        );

        const rewards = [400, 300, 200, 150, 100];
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        const embed = new EmbedBuilder()
            .setTitle('📊 Weekly Leaderboard')
            .setColor('#ffd700')
            .setDescription('Top 5 players this week:')
            .addFields(
                topUsers.rows.map((user, index) => ({
                    name: `${medals[index]} Place (${rewards[index]} coins)`,
                    value: `<@${user.user_id}> - ${user.total_won} coins won`
                }))
            );

        await interaction.reply({ embeds: [embed] });
    }
};
