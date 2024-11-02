const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');

const MaxRankingsPerMinute = 5;
const ExemptRankIds = [202120695, 7256120547, 7302550787];
const LoggedRankings = {};

module.exports = {
    async execute(client) {
        const groupId = process.env.GROUP_ID;
        const robloxCookie = process.env.RBX_COOKIE;

        try {
            // Log in to Noblox with the provided cookie
            await noblox.setCookie(robloxCookie);
            const user = await noblox.getAuthenticatedUser();
            console.log(`Logged in to Roblox as ${user.UserName}`);
            
            // Schedule log monitoring every minute
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

            // Check if the action was a rank action and exclude exempt IDs
            if ((actionType === "Rank" || actionType === "Promote" || actionType === "Demote") &&
                !ExemptRankIds.includes(rankerId)) {

                // Log this rank action in memory
                if (!LoggedRankings[rankerId]) LoggedRankings[rankerId] = [];
                LoggedRankings[rankerId].push(now);

                // Filter to keep only entries from the last minute
                LoggedRankings[rankerId] = LoggedRankings[rankerId].filter(timestamp => now - timestamp < 60000);

                // Check if rank limit has been exceeded
                if (LoggedRankings[rankerId].length > MaxRankingsPerMinute) {
                    // Demote user and send alert
                    noblox.setRank({ group: groupId, userId: rankerId, rank: 1 })
                        .then(() => sendSuspiciousActivityAlert(client, rankerId))
                        .catch(console.error);
                }
            }
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
    }
}

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
        
        // Button interaction collector
        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'revert') {
                // Implement rollback logic here
                await interaction.reply(`Rolling back actions for user ID: ${rankerId}`);
            } else if (interaction.customId === 'ignore') {
                await interaction.reply("Ignoring suspicious activity.");
            }
        });
    }
}
