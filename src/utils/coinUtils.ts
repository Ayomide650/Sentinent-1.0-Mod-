import { Pool } from 'pg';
import { Client } from 'discord.js';

const pool = new Pool({
    user: 'postgres',
    password: 'your_password',
    host: 'localhost',
    database: 'sentinent_bot',
    port: 5432,
});

export async function getUserCoins(userId: string): Promise<number> {
    const result = await pool.query(
        'SELECT coins FROM user_coins WHERE user_id = $1',
        [userId]
    );
    return result.rows[0]?.coins || 0;
}

export async function updateUserCoins(userId: string, amount: number): Promise<void> {
    await pool.query(
        `INSERT INTO user_coins (user_id, coins) 
         VALUES ($1, $2)
         ON CONFLICT (user_id) 
         DO UPDATE SET coins = user_coins.coins + $2`,
        [userId, amount]
    );
}

export async function handleMessageReward(userId: string): Promise<void> {
    const lastMessage = await pool.query(
        'SELECT last_message FROM user_coins WHERE user_id = $1',
        [userId]
    );

    const now = new Date();
    if (!lastMessage.rows[0]?.last_message || 
        (now.getTime() - lastMessage.rows[0].last_message.getTime()) > 60000) {
        await updateUserCoins(userId, 5);
        await pool.query(
            'UPDATE user_coins SET last_message = NOW() WHERE user_id = $1',
            [userId]
        );
    }
}

export async function distributeWeeklyRewards(): Promise<void> {
    const rewards = [400, 300, 200, 150, 100];
    const topUsers = await pool.query(
        'SELECT user_id, SUM(amount_won) as total_won FROM game_history GROUP BY user_id ORDER BY total_won DESC LIMIT 5'
    );

    for (let i = 0; i < topUsers.rows.length; i++) {
        await updateUserCoins(topUsers.rows[i].user_id, rewards[i]);
    }
}
