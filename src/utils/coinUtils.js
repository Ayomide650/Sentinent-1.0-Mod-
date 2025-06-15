// coinUtils.js - Updated to use Supabase instead of direct PostgreSQL
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get user's coin balance
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Promise<number>} User's coin balance
 */
async function getUserCoins(guildId, userId) {
  try {
    const { data, error } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? data.coins : 0;
  } catch (error) {
    console.error('Error getting user coins:', error);
    return 0;
  }
}

/**
 * Update user's coin balance
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add/subtract (can be negative)
 * @returns {Promise<number>} New coin balance
 */
async function updateUserCoins(guildId, userId, amount) {
  try {
    // Get current balance
    const currentCoins = await getUserCoins(guildId, userId);
    const newBalance = Math.max(0, currentCoins + amount); // Prevent negative balances

    // Update or insert record
    const { data, error } = await supabase
      .from('user_coins')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        coins: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'guild_id,user_id'
      })
      .select('coins')
      .single();

    if (error) {
      throw error;
    }

    return data.coins;
  } catch (error) {
    console.error('Error updating user coins:', error);
    throw error;
  }
}

/**
 * Set user's coin balance to a specific amount
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} amount - New coin balance
 * @returns {Promise<number>} New coin balance
 */
async function setUserCoins(guildId, userId, amount) {
  try {
    const newBalance = Math.max(0, amount); // Prevent negative balances

    const { data, error } = await supabase
      .from('user_coins')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        coins: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'guild_id,user_id'
      })
      .select('coins')
      .single();

    if (error) {
      throw error;
    }

    return data.coins;
  } catch (error) {
    console.error('Error setting user coins:', error);
    throw error;
  }
}

/**
 * Transfer coins between users
 * @param {string} guildId - Guild ID
 * @param {string} fromUserId - User giving coins
 * @param {string} toUserId - User receiving coins
 * @param {number} amount - Amount to transfer
 * @returns {Promise<{success: boolean, fromBalance: number, toBalance: number}>}
 */
async function transferCoins(guildId, fromUserId, toUserId, amount) {
  try {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Get sender's current balance
    const senderBalance = await getUserCoins(guildId, fromUserId);
    
    if (senderBalance < amount) {
      return {
        success: false,
        error: 'Insufficient funds',
        fromBalance: senderBalance,
        toBalance: await getUserCoins(guildId, toUserId)
      };
    }

    // Perform the transfer using a transaction-like approach
    const newSenderBalance = await updateUserCoins(guildId, fromUserId, -amount);
    const newReceiverBalance = await updateUserCoins(guildId, toUserId, amount);

    return {
      success: true,
      fromBalance: newSenderBalance,
      toBalance: newReceiverBalance
    };
  } catch (error) {
    console.error('Error transferring coins:', error);
    return {
      success: false,
      error: error.message,
      fromBalance: await getUserCoins(guildId, fromUserId),
      toBalance: await getUserCoins(guildId, toUserId)
    };
  }
}

/**
 * Get top users by coin balance for a guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return (default: 10)
 * @returns {Promise<Array>} Array of top users with their balances
 */
async function getTopUsers(guildId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('user_coins')
      .select('user_id, coins')
      .eq('guild_id', guildId)
      .order('coins', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
}

/**
 * Check if user has enough coins for a purchase
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} cost - Cost of the item
 * @returns {Promise<{canAfford: boolean, currentBalance: number, needed: number}>}
 */
async function canAffordItem(guildId, userId, cost) {
  try {
    const currentBalance = await getUserCoins(guildId, userId);
    const canAfford = currentBalance >= cost;
    
    return {
      canAfford,
      currentBalance,
      needed: canAfford ? 0 : cost - currentBalance
    };
  } catch (error) {
    console.error('Error checking affordability:', error);
    return {
      canAfford: false,
      currentBalance: 0,
      needed: cost
    };
  }
}

/**
 * Add daily reward coins to user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} dailyAmount - Daily reward amount (default: 100)
 * @returns {Promise<{success: boolean, newBalance: number, alreadyClaimed?: boolean}>}
 */
async function claimDailyReward(guildId, userId, dailyAmount = 100) {
  try {
    // Check if user already claimed today
    const { data: claimData, error: claimError } = await supabase
      .from('daily_claims')
      .select('claimed_at')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .gte('claimed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (claimData && !claimError) {
      const currentBalance = await getUserCoins(guildId, userId);
      return {
        success: false,
        alreadyClaimed: true,
        newBalance: currentBalance,
        nextClaimTime: new Date(new Date(claimData.claimed_at).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    // Add coins
    const newBalance = await updateUserCoins(guildId, userId, dailyAmount);

    // Record the claim
    await supabase
      .from('daily_claims')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        claimed_at: new Date().toISOString()
      }, {
        onConflict: 'guild_id,user_id'
      });

    return {
      success: true,
      newBalance,
      amountClaimed: dailyAmount
    };
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    return {
      success: false,
      error: error.message,
      newBalance: await getUserCoins(guildId, userId)
    };
  }
}

module.exports = {
  getUserCoins,
  updateUserCoins,
  setUserCoins,
  transferCoins,
  getTopUsers,
  canAffordItem,
  claimDailyReward
};
