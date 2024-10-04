// Import modules
require('dotenv').config(); // enviorment file (DONT DEL)
const express = require('express');
const noblox = require("noblox.js");
const os = require('os');
const { Client, IntentsBitField, ActivityType, EmbedBuilder } = require("discord.js");
const { REST } = require('@discordjs/rest'); // Import REST from @discordjs/rest
const { Routes } = require('discord-api-types/v10'); // Import Routes from discord-api-types

// Express app
const app = express();
app.use(express.json());

// Discord client setup
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildEmojisAndStickers
    ]
});

// vars
const version = "1.1.0";
const serverStartTime = Date.now();

// Environment variables
const port = process.env.PORT;
const GROUPID = process.env.GROUP_ID;
const COOKIE = process.env.RBX_COOKIE;
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Start the app and authenticate noblox.js
async function startApp() {
    try {
        const currentUser = await noblox.setCookie(COOKIE);
        console.log(`Logged in as ${currentUser.name}`);
    } catch (error) {
        console.error("Failed to start app:", error);
        process.exit(1);
    }
}

// Function to calculate the actual uptime
function updateUptime() {
    const now = Date.now();
    const uptimeMs = now - serverStartTime; // Get uptime in milliseconds

    let seconds = Math.floor(uptimeMs / 1000); // Convert to seconds
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    let months = Math.floor(days / 30.42); // Approximate month length
    let years = Math.floor(months / 12);

    // Remaining units after calculating months and years
    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 24;
    days = Math.floor(days % 30.42); // Remaining days after months
    months = months % 12; // Remaining months after years

    // Update the uptime variable
    uptime = {
        y: years,
        mo: months,  // months
        d: days,
        h: hours,
        m: minutes,  // minutes
        s: seconds
    };
}

// Get a string with the formatted uptime
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

// Set bot activity status
client.on("ready", (c) => {
    console.log(`😎👍 ${c.user.tag} is online!`);

    const status = [
        { name: `Uptime: ${(getUptimeString())}`, type: ActivityType.Watching },
        { name: "over Members 🕵️", type: ActivityType.Watching },
        { name: "over ROBLOX Group", type: ActivityType.Watching },
        { name: `Running on version: ${version} 😎`, type: ActivityType.Playing },
        { name: "over channels 🤖", type: ActivityType.Watching }
    ];

    setInterval(() => {
        const random = Math.floor(Math.random() * status.length);
        console.log(status[random])
        client.user.setActivity(status[random]);
    }, 10000);
});

// interaction handler
client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "coinflip") {
            const result = Math.ceil(Math.random() * 2);
            const headOrTails = result === 1 ? "Tails" : "Heads";

            interaction.reply({ content: `You flipped ${headOrTails}!`, ephemeral: false });
        } else if (interaction.commandName === "version") {
            interaction.reply({ content: `I am running on ${version}!`, ephemeral: false })
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === "delete-reply-bot-notif-ranking") {
            await interaction.reply({ content: "Deleted Reply", ephemeral: true });
            await interaction.message.delete();
        }
    }
});

// Rank POST request handler
app.post('/rank', async (req, res) => {
    const { userId, rankId, channelId } = req.body;
    const channel = client.channels.cache.get(channelId);

    try {
        if (!channel) throw new Error('Channel not found');

        const SuccesEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Player Promoted')
            .setDescription(`UserId: ${userId} has been promoted to RankId: ${rankId}`)
            .setTimestamp();

        await channel.send({ embeds: [SuccesEmbed] });
        return res.status(200).json({
            success: true,
            message: `User ${userId} ranked to ${rankId} and notified on Discord.`
        });
    } catch (error) {
        console.error('Error ranking player:', error);
        const FailEmbed = new EmbedBuilder()
            .setTitle('Player Promotion Failed')
            .setDescription(`UserId: ${userId} has failed to be promoted to RankId: ${rankId}`)
            .setTimestamp();

        await channel.send({ embeds: [FailEmbed] });
        return res.status(400).json({ success: false, message: error.message || 'An unexpected error occurred.' });
    }
});

// Register slash commands
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

// Init
setInterval(updateUptime, 1000); // Updates every second

// Start

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Log in the Discord client
client.login(TOKEN);

// Start noblox app
startApp();