import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { updateUserCoins } from '../../utils/coinUtils';

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins');

export async function execute(interaction: CommandInteraction) {
    const result = await pool.query(
        'SELECT last_daily FROM user_coins WHERE user_id = $1',
        [interaction.user.id]
    );

    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(4, 0, 0, 0); // 4:00 AM WAT

    if (result.rows[0]?.last_daily) {
        const lastDaily = new Date(result.rows[0].last_daily);
        if (lastDaily > resetTime) {
            return interaction.reply({
                content: 'You\'ve already claimed your daily coins! Try again after 4:00 AM WAT.',
                ephemeral: true
            });
        }
    }

    await updateUserCoins(interaction.user.id, 50);
    await pool.query(
        'UPDATE user_coins SET last_daily = NOW() WHERE user_id = $1',
        [interaction.user.id]
    );

    await interaction.reply({
        content: 'You\'ve claimed your daily 50 coins!',
        ephemeral: true
    });
}
