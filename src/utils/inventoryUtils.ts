import { pool } from '../database/connection';

export async function getStoreItems() {
    const result = await pool.query('SELECT * FROM store_items');
    return result.rows;
}

export async function getUserInventory(userId: string) {
    const result = await pool.query(
        `SELECT i.*, s.name, s.description 
         FROM user_inventory i 
         JOIN store_items s ON i.item_type = s.name 
         WHERE i.user_id = $1`,
        [userId]
    );
    return result.rows;
}

export async function purchaseItem(userId: string, itemName: string) {
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

export async function activateItem(userId: string, itemId: number) {
    await pool.query(
        'UPDATE user_inventory SET active = true, expires_at = NOW() + INTERVAL \'1 hour\' WHERE id = $1 AND user_id = $2',
        [itemId, userId]
    );
}
