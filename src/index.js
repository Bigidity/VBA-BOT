/*/ Import modules /*/
require('dotenv').config(); // enviorment file (DONT DEL)
const express = require('express');
const noblox = require("noblox.js");
const os = require('os');
const path = require('path'); // Use path for better file path handling
const { Client, IntentsBitField, ActivityType, EmbedBuilder } = require("discord.js");
const { REST } = require('@discordjs/rest'); // Import REST from @discordjs/rest
const { Routes } = require('discord-api-types/v10'); // Import Routes from discord-api-types
const { Console } = require('console');

/*/ Express app /*/
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/*/ Discord client setup /*/
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildEmojisAndStickers
    ]
});

/*/ vars /*/
const version = "1.7.0";
const serverStartTime = Date.now();
const XCSRF = await noblox.getGeneralToken()
let uptime = { y: 0, mo: 0, d: 0, h: 0, m: 0, s: 0 };

/*/ Environment variables /*/
const port = process.env.PORT;
const GROUPID = process.env.GROUP_ID;
const COOKIE = process.env.RBX_COOKIE;
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const HOSTNAME = "us2.bot-hosting.net";

/*/ Start the app and authenticate noblox.js /*/
async function startApp() {
    try {
        const currentUser = await noblox.setCookie(COOKIE);
        console.log(`Logged in as ${currentUser.name}`);
    } catch (error) {
        console.error("Failed to start app:", error);
        process.exit(1);
    }
}

/*/ Function to calculate the actual uptime /*/
function updateUptime() {
    const now = Date.now();
    const uptimeMs = now - serverStartTime; // Get uptime in milliseconds

    let totalSeconds = Math.floor(uptimeMs / 1000); // Convert milliseconds to seconds
    let totalMinutes = Math.floor(totalSeconds / 60);
    let totalHours = Math.floor(totalMinutes / 60);
    let totalDays = Math.floor(totalHours / 24);
    let totalMonths = Math.floor(totalDays / 30.42); // Approximate month length
    let totalYears = Math.floor(totalMonths / 12);

    // Remaining units after calculating years and months
    uptime.s = totalSeconds % 60;
    uptime.m = totalMinutes % 60;
    uptime.h = totalHours % 24;
    uptime.d = Math.floor(totalDays % 30.42); // Remaining days after months
    uptime.mo = totalMonths % 12; // Remaining months after years
    uptime.y = totalYears;
}

/*/ Get a string with the formatted uptime /*/
function getUptimeString() {
    let parts = [];

    // Only add non-zero values to the parts array
    if (uptime.y > 0) parts.push(`${uptime.y}y`);
    if (uptime.mo > 0) parts.push(`${uptime.mo}mo`);  // months
    if (uptime.d > 0) parts.push(`${uptime.d}d`);
    if (uptime.h > 0) parts.push(`${uptime.h}h`);
    if (uptime.m > 0) parts.push(`${uptime.m}m`);  // minutes
    if (uptime.s > 0) parts.push(`${uptime.s}s`);

    // Join the parts with spaces, if all values are zero return '0s'
    return parts.length > 0 ? parts.join(' ') : '0s';
}

/*/ Set bot activity status /*/
client.on("ready", (c) => {
    console.log(`😎👍 ${c.user.tag} is online!`);

    setInterval(() => {
        const status = [
            { name: `Uptime: ${getUptimeString()}`, type: ActivityType.Watching },
            { name: "over Members 🕵️", type: ActivityType.Watching },
            { name: "over ROBLOX Group", type: ActivityType.Watching },
            { name: `Running on version: ${version} 😎`, type: ActivityType.Playing },
            { name: "over channels 🤖", type: ActivityType.Watching }
        ];

        const random = Math.floor(Math.random() * status.length);
        console.log(status[random])
        client.user.setActivity(status[random]);
    }, 10000);
});

/*/ interaction handler /*/
client.on("interactionCreate", async (interaction) => {
    // Handle chat input commands (slash commands)
    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "coinflip":
                const result = Math.ceil(Math.random() * 2);
                const headOrTails = result === 1 ? "Tails" : "Heads";
                return interaction.reply({ content: `You flipped ${headOrTails}!`, ephemeral: false });
            
            case "version":
                return interaction.reply({ content: `I am running on ${version}!`, ephemeral: false });

            default:
                return interaction.reply({ content: "Unknown command.", ephemeral: true });
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "delete-reply-bot-notif-ranking":
                await interaction.reply({ content: "Deleted Reply", ephemeral: true });
                await interaction.message.delete();
                break;

            default:
                await interaction.reply({ content: "Unknown button action.", ephemeral: true });
        }
    }
});

/* Central function to handle all requests */
app.post('/api/ranker', async (req, res) => { // POST for modifying data
    const { userId, rankId } = req.body;

    console.log('Received rank request:', { userId, rankId });

    const channel = client.channels.cache.get("1249787149184798751"); // Discord channel ID for sending embeds

    try {
        // Check if userId or rankId are missing/undefined
        if (!userId || !rankId) {
            throw new Error('userId or rankId is missing or undefined');
        }

        if (!channel) throw new Error('Discord channel not found');

        // Attempt to rank the player using noblox.js

        // Check if user is in the group
        const isInGroup = await noblox.getRankInGroup(GROUPID, userId);
        if (isInGroup === 0) {
            throw new Error(`User ${userId} is not in the group.`);
        }

        // Try to change the rank
        console.log(GROUPID, userId, rankId);
        await noblox.setRank(XCSRF,GROUPID, userId, rankId);

        // Success embed
        const SuccessEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Player Promoted')
            .setDescription(`UserId: ${userId} has been promoted to RankId: ${rankId}`)
            .setTimestamp();

        await channel.send({ embeds: [SuccessEmbed] });

        return res.status(200).json({
            success: true,
            message: `User ${userId} ranked to ${rankId} and notified on Discord.`
        });
    } catch (error) {
        console.error('Error ranking player:', error);

        // Fail embed
        const FailEmbed = new EmbedBuilder()
            .setColor(0xFF0000) // Red for failure
            .setTitle('Player Promotion Failed')
            .setDescription(`Failed to promote UserId: ${userId} to RankId: ${rankId}. Error: ${error.message}`)
            .setTimestamp();

        if (channel) {
            await channel.send({ embeds: [FailEmbed] });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/status', (req, res) => {
    return res.json({ message: 'API is working!', uptime: process.uptime() });
});

app.get('/api', (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/pages/api_index.html'));
});

app.get('/home', (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/pages/index.html'));
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});


/*/ Register slash commands /*/
const commands = [
    { name: "coinflip", description: "Flip a coin!" },
    { name: "version", description: "Gives the current version I'm running on!" }
];   

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log("Slash commands registered successfully!");
    } catch (error) {
        console.error(`Error registering commands: ${error}`);
    }
})();

/*/ Init /*/
setInterval(updateUptime, 1000); // Updates every second

/*/ Start /*/

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Website is running on http://${HOSTNAME}:${port}`);
});

// Log in the Discord client  
client.login(TOKEN);

// Start noblox app
startApp();