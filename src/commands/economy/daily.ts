import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { updateUserCoins } from '../../utils/coinUtils';

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins');

export async function execute(interaction: CommandInteraction) {
    const userId = interaction.user.id;
    const result = await pool.query(
        'SELECT last_daily FROM user_coins WHERE user_id = $1',
        [userId]
    );

    const now = new Date();
    const lastDaily = result.rows[0]?.last_daily;
    const resetTime = new Date(now);
    resetTime.setHours(4, 0, 0, 0); // 4:00 AM WAT

    if (lastDaily && now < resetTime && lastDaily > resetTime.setDate(resetTime.getDate() - 1)) {
        return interaction.reply({ 
            content: 'You\'ve already claimed your daily coins!',
            ephemeral: true 
        });
    }

    await updateUserCoins(userId, 50);
    await pool.query(
        'UPDATE user_coins SET last_daily = NOW() WHERE user_id = $1',
        [userId]
    );

    await interaction.reply({
        content: 'You\'ve claimed your daily 50 coins!',
        ephemeral: true
    });
}
