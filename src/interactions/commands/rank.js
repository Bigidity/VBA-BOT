require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const { GetKeyContents, SetDataToKey, SetHashField, GetHashField } =  require(path.join(__dirname, '../events/UpstashRedisHandler.js'));
const noblox = require("noblox.js");

const GROUPID = process.env.GROUP_ID;
const CHANNEL_ID = "1264255128505024623"; // Channel where the embed will be sent

// Define command permissions for /rank command
const commandPermissions = {
    "1292450315034951751": "Ranker Role 1", // Replace with actual role IDs
};

// Define approval permissions for Accept/Deny actions
const approvalPermissions = {
    "1237150326168096914": "Approver Role 1",
};

// Define the rank map
const rankMap = {
    "Recruit": 1,
    "Private": 2,
    "Lance Corporal": 3,
    "Corporal": 4,
    "Sergeant": 5,
    "Colour Sergeant": 6,
    "Warrant Officer": 7,
    "Second Lieutenant": 8,
    "Lieutenant": 9,
    "Captain": 10,
    "Major": 11,
    "Lieutenant Colonel": 12,
    "Colonel": 13,
    "Brigadier": 14,
    "Major General": 15,
    "Lieutenant General": 16,
    "General": 17,
    "Ministers": 18,
    "Field Marshal": 19,
    "Developer": 20,
    "Vice Chief Of Defence": 21,
    "Chief Of Defence": 254,
    "Holder": 255
};

// Initialize Noblox
async function startApp() {
    await noblox.setCookie(process.env.RBX_COOKIE);
}

// Main Rank Command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Rank a Roblox User (This is a secured action)')
        .addStringOption(option =>
            option.setName('roblox-user')
                .setDescription('The user to rank')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rank-name')
                .setDescription('The rank to assign')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Check if user has permission to use the rank command
        const memberRoles = interaction.member.roles.cache;
        const hasPermission = memberRoles.some(role => commandPermissions[role.id]);

        if (!hasPermission) {
            return interaction.editReply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        // Get command options
        const ranker = interaction.user;
        const targetUsername = interaction.options.getString('roblox-user');
        const rankName = interaction.options.getString('rank-name');

        // Check if the rank exists in the rankMap
        const targetRankId = rankMap[rankName];
        if (!targetRankId) {
            return interaction.editReply({ content: "Invalid rank name provided.", ephemeral: true });
        }

        // Simulate fetching target Roblox user ID
        const targetUserId = await noblox.getIdFromUsername(targetUsername);

        // Run the ranking request function
        const requestId = await RequestRank({
            ranker,
            targetUserId,
            targetUsername,
            rankName,
            targetRankId,
            interaction
        });

        await interaction.editReply({ content: `Rank request ID ${requestId} created.`, ephemeral: true });
    }
};

// Function to handle the rank request
async function RequestRank({ ranker, targetUserId, targetUsername, rankName, targetRankId, interaction }) {
    const nextRequestId = await SetDataToKey("rankRequest_NextId", null, "INCR");
    const requestKey = `RankRequest:${nextRequestId}`;

    // Embed setup
    const embed = new EmbedBuilder()
        .setTitle("Rank Request")
        .setDescription(`${ranker.username} requests to rank ${targetUsername} to "${rankName}"`)
        .setFooter({ text: `Request ID: ${nextRequestId}` })
        .setTimestamp();

    const acceptButton = new ButtonBuilder()
        .setCustomId(`accept_${nextRequestId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success);

    const denyButton = new ButtonBuilder()
        .setCustomId(`deny_${nextRequestId}`)
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(acceptButton, denyButton);

    // Send the embed
    const channel = await interaction.client.channels.fetch(CHANNEL_ID);
    const message = await channel.send({ embeds: [embed], components: [actionRow] });

    // Store request in Redis
    await SetHashField(requestKey, "rankerId", ranker.id);
    await SetHashField(requestKey, "targetUserId", targetUserId);
    await SetHashField(requestKey, "targetUsername", targetUsername);
    await SetHashField(requestKey, "rankName", rankName);
    await SetHashField(requestKey, "rankId", targetRankId);
    await SetHashField(requestKey, "messageId", message.id);

    return nextRequestId;
}

// Handle Button Interaction
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const [action, requestId] = interaction.customId.split("_");
    const requestKey = `RankRequest:${requestId}`;

    // Check if user has approval permissions
    const memberRoles = interaction.member.roles.cache;
    const hasApprovalPermission = memberRoles.some(role => approvalPermissions[role.id]);

    if (!hasApprovalPermission) {
        return interaction.reply({ content: "You don't have permission to approve or deny this request.", ephemeral: true });
    }

    // Fetch request data from Redis
    const rankInfo = {
        rankerId: await GetHashField(requestKey, "rankerId"),
        targetUserId: await GetHashField(requestKey, "targetUserId"),
        targetUsername: await GetHashField(requestKey, "targetUsername"),
        rankId: await GetHashField(requestKey, "rankId")
    };

    // Check if the request data is valid
    if (!rankInfo.targetUserId || !rankInfo.rankId) {
        await interaction.update({ content: "Invalid rank request data. It may have been removed.", components: [] });
        return;
    }

    if (action === "accept") {
        // Attempt to rank using Noblox.js
        try {
            await noblox.setRank(GROUPID, rankInfo.targetUserId, parseInt(rankInfo.rankId));
            await interaction.update({ content: "Rank accepted and updated on Roblox!", components: [] });
        } catch (error) {
            await interaction.update({ content: "An error occurred while updating the rank.", components: [] });
            console.error("Ranking Error:", error);
        }
    } else if (action === "deny") {
        // Deny the rank request
        await interaction.update({ content: "Rank request denied.", components: [] });
    }

    // Clean up the request from Redis
    await SetDataToKey(requestKey, null, "DEL");
});
