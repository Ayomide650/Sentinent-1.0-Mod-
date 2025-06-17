const { pool } = require('../database/connection');

/**
 * Get store items, optionally filtered by category
 * @param {string} category - Filter by category ('all' for all items)
 * @returns {Array} Array of store items
 */
async function getStoreItems(category = 'all') {
    try {
        let query = `
            SELECT id, name, description, price, emoji, category, in_stock, max_quantity
            FROM store_items 
            WHERE in_stock = true
        `;
        
        const params = [];
        
        if (category && category !== 'all') {
            query += ` AND category = $1`;
            params.push(category);
        }
        
        query += ` ORDER BY category, price ASC`;
        
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching store items:', error);
        return [];
    }
}

/**
 * Get all store items (including out of stock) - for admin use
 * @returns {Array} Array of all store items
 */
async function getAllStoreItems() {
    try {
        const result = await pool.query(`
            SELECT id, name, description, price, emoji, category, in_stock, max_quantity, created_at
            FROM store_items 
            ORDER BY category, price ASC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all store items:', error);
        return [];
    }
}

/**
 * Get a specific store item by name or ID
 * @param {string|number} identifier - Item name or ID
 * @returns {Object|null} Store item or null if not found
 */
async function getStoreItem(identifier) {
    try {
        let query, param;
        
        if (typeof identifier === 'number' || !isNaN(identifier)) {
            query = 'SELECT * FROM store_items WHERE id = $1';
            param = Number(identifier);
        } else {
            query = 'SELECT * FROM store_items WHERE LOWER(name) = LOWER($1)';
            param = identifier;
        }
        
        const result = await pool.query(query, [param]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching store item:', error);
        return null;
    }
}

/**
 * Get user inventory with item details
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @returns {Array} User's inventory items
 */
async function getUserInventory(userId, guildId = null) {
    try {
        let query = `
            SELECT 
                i.*,
                s.name,
                s.description,
                s.emoji,
                s.category,
                s.price
            FROM user_inventory i 
            JOIN store_items s ON i.item_type = s.name 
            WHERE i.user_id = $1
        `;
        
        const params = [userId];
        
        if (guildId) {
            query += ` AND i.guild_id = $2`;
            params.push(guildId);
        }
        
        query += ` ORDER BY i.acquired_at DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching user inventory:', error);
        return [];
    }
}

/**
 * Purchase an item for a user
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {string} itemName - Name of item to purchase
 * @param {number} pricePaid - Price paid for the item
 * @returns {Object} Purchase result with success status and message
 */
async function purchaseItem(userId, guildId, itemName, pricePaid) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Get item details
        const itemResult = await client.query(
            'SELECT * FROM store_items WHERE LOWER(name) = LOWER($1)',
            [itemName]
        );
        
        if (itemResult.rows.length === 0) {
            throw new Error('Item not found in store');
        }
        
        const item = itemResult.rows[0];
        
        if (!item.in_stock) {
            throw new Error('Item is currently out of stock');
        }
        
        // Check if user already owns this item (for unique items)
        if (['VIP Badge', 'Rainbow Role', 'Golden Ticket'].includes(item.name)) {
            const existingResult = await client.query(
                'SELECT id FROM user_inventory WHERE user_id = $1 AND guild_id = $2 AND item_type = $3',
                [userId, guildId, itemName]
            );
            
            if (existingResult.rows.length > 0) {
                throw new Error('You already own this item');
            }
        }
        
        // Add item to user inventory
        const inventoryResult = await client.query(
            'INSERT INTO user_inventory (guild_id, user_id, item_type, item_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [guildId, userId, itemName, item.id]
        );
        
        // Record purchase history
        await client.query(
            'INSERT INTO purchase_history (guild_id, user_id, item_id, item_name, price_paid) VALUES ($1, $2, $3, $4, $5)',
            [guildId, userId, item.id, itemName, pricePaid]
        );
        
        await client.query('COMMIT');
        
        return {
            success: true,
            message: `Successfully purchased ${item.emoji} **${item.name}**!`,
            item: item,
            inventoryId: inventoryResult.rows[0].id
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error purchasing item:', error);
        return {
            success: false,
            message: error.message || 'Failed to purchase item'
        };
    } finally {
        client.release();
    }
}

/**
 * Activate an item from user's inventory
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {number} inventoryId - Inventory item ID
 * @param {number} durationHours - Duration in hours (default 1)
 * @returns {boolean} Success status
 */
async function activateItem(userId, guildId, inventoryId, durationHours = 1) {
    try {
        const result = await pool.query(
            `UPDATE user_inventory 
             SET active = true, expires_at = NOW() + INTERVAL '${durationHours} hours'
             WHERE id = $1 AND user_id = $2 AND guild_id = $3 AND active = false`,
            [inventoryId, userId, guildId]
        );
        
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error activating item:', error);
        return false;
    }
}

/**
 * Check and expire items that have passed their expiry time
 * @returns {number} Number of items expired
 */
async function checkItemExpiry() {
    try {
        const result = await pool.query(
            'UPDATE user_inventory SET active = false WHERE expires_at < NOW() AND active = true'
        );
        
        if (result.rowCount > 0) {
            console.log(`Expired ${result.rowCount} items`);
        }
        
        return result.rowCount;
    } catch (error) {
        console.error('Error checking item expiry:', error);
        return 0;
    }
}

/**
 * Check if user owns a specific item type
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {string} itemType - Item type to check
 * @param {boolean} activeOnly - Check only active items
 * @returns {boolean} Whether user owns the item
 */
async function checkItemOwnership(userId, guildId, itemType, activeOnly = false) {
    try {
        let query = 'SELECT id FROM user_inventory WHERE user_id = $1 AND guild_id = $2 AND item_type = $3';
        
        if (activeOnly) {
            query += ' AND active = true AND (expires_at IS NULL OR expires_at > NOW())';
        }
        
        const result = await pool.query(query, [userId, guildId, itemType]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking item ownership:', error);
        return false;
    }
}

/**
 * Get user's active items
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @returns {Array} Active items
 */
async function getActiveItems(userId, guildId) {
    try {
        const result = await pool.query(
            `SELECT i.*, s.name, s.emoji, s.description
             FROM user_inventory i
             JOIN store_items s ON i.item_type = s.name
             WHERE i.user_id = $1 AND i.guild_id = $2 AND i.active = true 
             AND (i.expires_at IS NULL OR i.expires_at > NOW())
             ORDER BY i.expires_at ASC`,
            [userId, guildId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error fetching active items:', error);
        return [];
    }
}

/**
 * Add a new item to the store (admin function)
 * @param {Object} itemData - Item data
 * @returns {boolean} Success status
 */
async function addStoreItem(itemData) {
    try {
        const result = await pool.query(
            'INSERT INTO store_items (name, description, price, emoji, category, max_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                itemData.name,
                itemData.description,
                itemData.price,
                itemData.emoji || '🛍️',
                itemData.category || 'general',
                itemData.max_quantity || null
            ]
        );
        
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error adding store item:', error);
        return false;
    }
}

module.exports = {
    getStoreItems,
    getAllStoreItems,
    getStoreItem,
    getUserInventory,
    purchaseItem,
    activateItem,
    checkItemExpiry,
    checkItemOwnership,
    getActiveItems,
    addStoreItem
};
