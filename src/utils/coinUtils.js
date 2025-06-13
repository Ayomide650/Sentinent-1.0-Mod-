const { pool } = require('../database/connection');

async function getUserCoins(userId) {
    const result = await pool.query(
        'SELECT coins FROM user_coins WHERE user_id = $1',
        [userId]
    );
    return result.rows[0]?.coins || 0;
}

async function updateUserCoins(userId, amount) {
    await pool.query(
        `INSERT INTO user_coins (user_id, coins) 
         VALUES ($1, $2)
         ON CONFLICT (user_id) 
         DO UPDATE SET coins = user_coins.coins + $2`,
        [userId, amount]
    );
}

async function handleMessageReward(userId) {
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

async function handleLevelUpReward(userId) {
    await updateUserCoins(userId, 50);
}

module.exports = {
    getUserCoins,
    updateUserCoins,
    handleMessageReward,
    handleLevelUpReward
};
