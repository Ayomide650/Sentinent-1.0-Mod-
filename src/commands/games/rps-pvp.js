const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserCoins } = require('../../utils/coinUtils');

// Store active invites - target_user_id -> invite_data
const activeInvites = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps-challenge')
        .setDescription('Challenge another player to Rock Paper Scissors')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('Player to challenge')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('rounds')
                .setDescription('Number of rounds to play (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Coins to bet per round')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000)),
    
    async execute(interaction) {
        try {
            const guildId = interaction.guild?.id;
            if (!guildId) {
                return await interaction.reply({
                    content: '❌ This command can only be used in a server!',
                    ephemeral: true
                });
            }

            const challenger = interaction.user;
            const opponent = interaction.options.getUser('opponent');
            const rounds = interaction.options.getInteger('rounds');
            const betAmount = interaction.options.getInteger('bet');
            const totalBet = betAmount * rounds;

            // Validation checks
            if (opponent.id === challenger.id) {
                return await interaction.reply({
                    content: '❌ You cannot challenge yourself!',
                    ephemeral: true
                });
            }

            if (opponent.bot) {
                return await interaction.reply({
                    content: '❌ You cannot challenge bots! Use `/rps-bot` instead.',
                    ephemeral: true
                });
            }

            // Check if opponent already has a pending invite
            if (activeInvites.has(opponent.id)) {
                const existingInvite = activeInvites.get(opponent.id);
                const existingChallenger = interaction.guild.members.cache.get(existingInvite.challengerId);
                return await interaction.reply({
                    content: `❌ <@${opponent.id}> already has a pending Rock Paper Scissors invite from ${existingChallenger ? existingChallenger.displayName : 'another player'}!`,
                    ephemeral: true
                });
            }

            // Check if challenger has enough coins
            const challengerCoins = await getUserCoins(guildId, challenger.id);
            if (challengerCoins < totalBet) {
                return await interaction.reply({
                    content: `❌ You don't have enough coins! You need **${totalBet}** coins (${betAmount} per round × ${rounds} rounds) but only have **${challengerCoins}** coins.`,
                    ephemeral: true
                });
            }

            // Check if opponent has enough coins
            const opponentCoins = await getUserCoins(guildId, opponent.id);
            if (opponentCoins < totalBet) {
                return await interaction.reply({
                    content: `❌ <@${opponent.id}> doesn't have enough coins for this challenge! They need **${totalBet}** coins but only have **${opponentCoins}** coins.`,
                    ephemeral: true
                });
            }

            // Create invite
            const inviteData = {
                challengerId: challenger.id,
                opponentId: opponent.id,
                guildId,
                rounds,
                betAmount,
                totalBet,
                channelId: interaction.channel.id,
                createdAt: Date.now()
            };

            activeInvites.set(opponent.id, inviteData);

            // Create challenge embed
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🎮 Rock Paper Scissors Challenge!')
                .setDescription(`<@${challenger.id}> has challenged <@${opponent.id}> to Rock Paper Scissors!`)
                .addFields(
                    { name: '🎯 Rounds', value: `${rounds}`, inline: true },
                    { name: '💰 Bet per round', value: `${betAmount} coins`, inline: true },
                    { name: '💎 Total bet', value: `${totalBet} coins`, inline: true },
                    { name: '📝 Instructions', value: `<@${opponent.id}>, use \`/rps-accept\` to accept or \`/rps-reject\` to decline this challenge.\n\n⏰ This invite expires in 1 minute.`, inline: false }
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                content: `<@${opponent.id}>`,
                ephemeral: false
            });

            // Set timeout for invite expiry (1 minute)
            setTimeout(() => {
                if (activeInvites.has(opponent.id)) {
                    activeInvites.delete(opponent.id);
                    interaction.followUp({
                        content: `⏰ Challenge from <@${challenger.id}> to <@${opponent.id}> has expired.`,
                        ephemeral: false
                    }).catch(console.error);
                }
            }, 60000);

        } catch (error) {
            console.error('Error in rps-challenge command:', error);
            await interaction.reply({
                content: '❌ An error occurred while creating the challenge.',
                ephemeral: true
            });
        }
    },

    // Export the invites map for other commands
    activeInvites
};
