// Import your existing database connection
const { supabase } = require('../database/database.js');

// Milestone levels that trigger special rewards
const MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

// XP calculation formula
function getXpForLevel(level) {
    if (level <= 1) return 0;
    // Progressive XP formula - gets harder as you level up
    const baseXp = (level - 1) * 100;
    const progressiveXp = (level - 1) * (level - 2) * 25;
    return baseXp + progressiveXp;
}

module.exports = {
    /**
     * Get the highest milestone level the user has reached
     * @param {number} level - Current user level
     * @returns {number|null} - Highest milestone reached or null if none
     */
    getMilestone(level) {
        return MILESTONE_LEVELS.filter(lvl => lvl <= level).pop() || null;
    },

    /**
     * Get the next milestone level the user can reach
     * @param {number} level - Current user level
     * @returns {number|null} - Next milestone level or null if max reached
     */
    getNextMilestone(level) {
        return MILESTONE_LEVELS.find(lvl => lvl > level) || null;
    },

    /**
     * Calculate XP needed to reach the next level
     * @param {number} xp - Current XP
     * @param {number} level - Current level
     * @returns {number} - XP needed for next level
     */
    getXpToNextLevel(xp, level) {
        return getXpForLevel(level + 1) - xp;
    },

    /**
     * Calculate current level based on XP
     * @param {number} xp - Total XP
     * @returns {number} - Current level
     */
    getLevelFromXp(xp) {
        let level = 1;
        while (getXpForLevel(level + 1) <= xp) {
            level++;
        }
        return level;
    },

    /**
     * Get level progress as percentage
     * @param {number} xp - Current XP
     * @param {number} level - Current level
     * @returns {number} - Progress percentage (0-100)
     */
    getLevelProgress(xp, level) {
        const currentLevelXp = getXpForLevel(level);
        const nextLevelXp = getXpForLevel(level + 1);
        const progressXp = xp - currentLevelXp;
        const totalXpNeeded = nextLevelXp - currentLevelXp;
        
        return Math.floor((progressXp / totalXpNeeded) * 100);
    },

    /**
     * Get user's current level data from database
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @returns {object|null} - User level data or null if not found
     */
    async getUserLevel(userId, guildId) {
        try {
            const { data, error } = await supabase
                .from('user_levels')
                .select('*')
                .eq('user_id', userId)
                .eq('guild_id', guildId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Error fetching user level:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Error in getUserLevel:', err);
            return null;
        }
    },

    /**
     * Create or update user level data
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @param {object} levelData - Level data to update
     * @returns {object|null} - Updated user data or null if error
     */
    async updateUserLevel(userId, guildId, levelData) {
        try {
            const { data, error } = await supabase
                .from('user_levels')
                .upsert({
                    user_id: userId,
                    guild_id: guildId,
                    ...levelData,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error updating user level:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Error in updateUserLevel:', err);
            return null;
        }
    },

    /**
     * Add XP to user and handle level ups
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @param {number} xpGain - Amount of XP to add
     * @returns {object} - Level up result
     */
    async addXp(userId, guildId, xpGain) {
        try {
            // Get current user data
            let userData = await this.getUserLevel(userId, guildId);
            
            // Create new user if doesn't exist
            if (!userData) {
                userData = {
                    user_id: userId,
                    guild_id: guildId,
                    xp: 0,
                    level: 1,
                    total_messages: 0,
                    last_xp_gain: null
                };
            }

            const oldXp = userData.xp;
            const oldLevel = userData.level;
            const newXp = oldXp + xpGain;
            const newLevel = this.getLevelFromXp(newXp);

            // Update user data
            const updatedData = await this.updateUserLevel(userId, guildId, {
                xp: newXp,
                level: newLevel,
                total_messages: (userData.total_messages || 0) + 1,
                last_xp_gain: new Date().toISOString()
            });

            // Check for level up and milestone
            const leveledUp = newLevel > oldLevel;
            const oldMilestone = this.getMilestone(oldLevel);
            const newMilestone = this.getMilestone(newLevel);
            const reachedMilestone = newMilestone > oldMilestone;

            return {
                success: true,
                leveledUp,
                oldLevel,
                newLevel,
                oldXp,
                newXp,
                xpGain,
                reachedMilestone,
                milestone: reachedMilestone ? newMilestone : null,
                userData: updatedData
            };

        } catch (err) {
            console.error('Error in addXp:', err);
            return {
                success: false,
                error: err.message
            };
        }
    },

    /**
     * Check if user is on XP cooldown
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @param {number} cooldownSeconds - Cooldown time in seconds (default 5)
     * @returns {boolean} - True if on cooldown
     */
    async isOnCooldown(userId, guildId, cooldownSeconds = 5) {
        try {
            const userData = await this.getUserLevel(userId, guildId);
            
            if (!userData || !userData.last_xp_gain) {
                return false; // No previous XP gain, not on cooldown
            }

            const lastXpGain = new Date(userData.last_xp_gain);
            const now = new Date();
            const timeDiff = (now - lastXpGain) / 1000; // Convert to seconds

            return timeDiff < cooldownSeconds;
        } catch (err) {
            console.error('Error checking cooldown:', err);
            return false; // If error, allow XP gain
        }
    },

    /**
     * Get leaderboard for a guild
     * @param {string} guildId - Discord guild ID
     * @param {number} limit - Number of users to return (default 10)
     * @returns {array} - Array of user level data sorted by XP
     */
    async getLeaderboard(guildId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('user_levels')
                .select('*')
                .eq('guild_id', guildId)
                .order('xp', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('Error in getLeaderboard:', err);
            return [];
        }
    },

    /**
     * Get user's rank in guild
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @returns {number|null} - User's rank or null if not found
     */
    async getUserRank(userId, guildId) {
        try {
            const userData = await this.getUserLevel(userId, guildId);
            if (!userData) return null;

            const { data, error } = await supabase
                .from('user_levels')
                .select('user_id')
                .eq('guild_id', guildId)
                .gt('xp', userData.xp);

            if (error) {
                console.error('Error fetching user rank:', error);
                return null;
            }

            return (data?.length || 0) + 1; // +1 because we count users with MORE xp
        } catch (err) {
            console.error('Error in getUserRank:', err);
            return null;
        }
    },

    /**
     * Get level rewards for a specific level
     * @param {string} guildId - Discord guild ID
     * @param {number} level - Level to check rewards for
     * @returns {array} - Array of role IDs for that level
     */
    async getLevelRewards(guildId, level) {
        try {
            const { data, error } = await supabase
                .from('level_rewards')
                .select('role_id')
                .eq('guild_id', guildId)
                .eq('level', level);

            if (error) {
                console.error('Error fetching level rewards:', error);
                return [];
            }

            return data?.map(row => row.role_id) || [];
        } catch (err) {
            console.error('Error in getLevelRewards:', err);
            return [];
        }
    },

    /**
     * Get all milestone rewards for a guild
     * @param {string} guildId - Discord guild ID
     * @returns {object} - Object with level as key, role IDs as value
     */
    async getAllLevelRewards(guildId) {
        try {
            const { data, error } = await supabase
                .from('level_rewards')
                .select('level, role_id')
                .eq('guild_id', guildId)
                .order('level', { ascending: true });

            if (error) {
                console.error('Error fetching all level rewards:', error);
                return {};
            }

            // Group by level
            const rewards = {};
            data?.forEach(row => {
                if (!rewards[row.level]) {
                    rewards[row.level] = [];
                }
                rewards[row.level].push(row.role_id);
            });

            return rewards;
        } catch (err) {
            console.error('Error in getAllLevelRewards:', err);
            return {};
        }
    },

    /**
     * Get formatted level info for display
     * @param {string} userId - Discord user ID
     * @param {string} guildId - Discord guild ID
     * @returns {object|null} - Formatted level information
     */
    async getLevelInfo(userId, guildId) {
        try {
            const userData = await this.getUserLevel(userId, guildId);
            if (!userData) return null;

            const rank = await this.getUserRank(userId, guildId);

            return {
                level: userData.level,
                xp: userData.xp,
                xpToNext: this.getXpToNextLevel(userData.xp, userData.level),
                progress: this.getLevelProgress(userData.xp, userData.level),
                currentMilestone: this.getMilestone(userData.level),
                nextMilestone: this.getNextMilestone(userData.level),
                totalMessages: userData.total_messages || 0,
                rank: rank,
                lastXpGain: userData.last_xp_gain
            };
        } catch (err) {
            console.error('Error in getLevelInfo:', err);
            return null;
        }
    }
};
