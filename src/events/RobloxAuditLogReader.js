const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');

const MaxRankingsPerMinute = 5;
const ExemptRankIds = [202120695, 7256120547, 7302550787];
const LoggedRankings = {};
const RecentRankChanges = {}; // Store recent rank changes for potential rollback

module.exports = {
    async execute(client) {
        const groupId = process.env.GROUP_ID;
        const robloxCookie = process.env.RBX_COOKIE;

        try {
            await noblox.setCookie(robloxCookie);
            const user = await noblox.getAuthenticatedUser();
            console.log(`Logged in to Roblox as ${user.UserName}`);
            
            setInterval(() => monitorAuditLogs(client, groupId), 60000);
        } catch (error) {
            console.error("Failed to log in to Roblox:", error);
        }
    }
};

async function monitorAuditLogs(client, groupId) {
    try {
        const logs = await noblox.getAuditLog({ group: groupId });
        const now = Date.now();

        logs.data.forEach(log => {
            const actionType = log.actionType;
            const rankerId = log.actor.userId;
            const targetUserId = log.targetId;

            if ((actionType === "Rank" || actionType === "Promote" || actionType === "Demote") &&
                !ExemptRankIds.includes(rankerId)) {

                if (!LoggedRankings[rankerId]) LoggedRankings[rankerId] = [];
                LoggedRankings[rankerId].push(now);

                LoggedRankings[rankerId] = LoggedRankings[rankerId].filter(timestamp => now - timestamp < 60000);

                if (LoggedRankings[rankerId].length > MaxRankingsPerMinute) {
                    // Store previous rank of the target user for rollback
                    noblox.getRankInGroup(groupId, targetUserId).then(previousRank => {
                        if (!RecentRankChanges[rankerId]) RecentRankChanges[rankerId] = [];
                        RecentRankChanges[rankerId].push({ userId: targetUserId, previousRank });

                        noblox.setRank({ group: groupId, userId: rankerId, rank: 1 })
                            .then(() => sendSuspiciousActivityAlert(client, rankerId))
                            .catch(console.error);
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
    }
};

// Function to send an alert message to Discord with rollback options
async function sendSuspiciousActivityAlert(client, rankerId) {
    const embed = new EmbedBuilder()
        .setTitle("Suspicious Ranking Activity Detected")
        .setDescription(`Suspicious ranking activity by user ID: ${rankerId}`)
        .setColor("RED");

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('revert')
                .setLabel('Revert Actions')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ignore')
                .setLabel('Ignore')
                .setStyle(ButtonStyle.Secondary)
        );

    const alertChannel = client.channels.cache.get("1249787149184798751");
    if (alertChannel) {
        const message = await alertChannel.send({ embeds: [embed], components: [row] });
        
        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'revert') {
                await rollbackRankChanges(rankerId);
                await interaction.reply(`Rolled back actions for user ID: ${rankerId}`);
            } else if (interaction.customId === 'ignore') {
                await interaction.reply("Ignoring suspicious activity.");
            }
        });
    }
};

// Rollback function to revert recent rank changes made by the ranker
async function rollbackRankChanges(rankerId) {
    const changes = RecentRankChanges[rankerId];

    if (changes) {
        for (const change of changes) {
            await noblox.setRank({
                group: process.env.GROUP_ID,
                userId: change.userId,
                rank: change.previousRank
            });
        }
        // Clear the changes after rollback
        delete RecentRankChanges[rankerId];
    }
};