const { pool } = require('../database/connection');

async function getStoreItems() {
    const result = await pool.query('SELECT * FROM store_items');
    return result.rows;
}

async function getUserInventory(userId) {
    const result = await pool.query(
        `SELECT i.*, s.name, s.description 
         FROM user_inventory i 
         JOIN store_items s ON i.item_type = s.name 
         WHERE i.user_id = $1`,
        [userId]
    );
    return result.rows;
}

async function purchaseItem(userId, itemName) {
    const item = await pool.query(
        'SELECT * FROM store_items WHERE name = $1',
        [itemName]
    );

    if (!item.rows[0]) {
        throw new Error('Item not found');
    }

    await pool.query(
        'INSERT INTO user_inventory (user_id, item_type) VALUES ($1, $2)',
        [userId, itemName]
    );
}

async function activateItem(userId, itemId) {
    await pool.query(
        'UPDATE user_inventory SET active = true, expires_at = NOW() + INTERVAL \'1 hour\' WHERE id = $1 AND user_id = $2',
        [itemId, userId]
    );
}

async function checkItemExpiry() {
    await pool.query(
        'UPDATE user_inventory SET active = false WHERE expires_at < NOW() AND active = true'
    );
}

async function checkItemOwnership(userId, itemType) {
    const result = await pool.query(
        'SELECT * FROM user_inventory WHERE user_id = $1 AND item_type = $2 AND active = false',
        [userId, itemType]
    );
    return result.rows.length > 0;
}

module.exports = {
    getStoreItems,
    getUserInventory,
    purchaseItem,
    activateItem,
    checkItemExpiry,
    checkItemOwnership
};
