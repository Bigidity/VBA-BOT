/*/ Import modules /*/
require('dotenv').config(); // enviorment file (DONT DEL)
const express = require('express');
const noblox = require("noblox.js");
const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs');
const now = require('performance-now');
const path = require('path'); // Use path for better file path handling
const { Client, IntentsBitField, ActivityType, EmbedBuilder, User } = require("discord.js");
const { REST } = require('@discordjs/rest'); // Import REST from @discordjs/rest
const { Routes } = require('discord-api-types/v10'); // Import Routes from discord-api-types
const { Console } = require('console');

/*CUSTOM MODULES*/

const rankHandler = require('./api_responds/_api_ranker');

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
const serverStartTime = Date.now();
let uptime = { y: 0, mo: 0, d: 0, h: 0, m: 0, s: 0 };

/*/ Environment variables /*/
const port = process.env.PORT;
const GROUPID = process.env.GROUP_ID;
const COOKIE = process.env.RBX_COOKIE;
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const HOSTNAME = "us2.bot-hosting.net";
const version = process.env.VERSION;

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

    // Execute needed events
    const auditLogReader = require('./events/RobloxAuditLogReader'); 
    auditLogReader.execute(client);

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

/*START INTERACTION HANDLER*/

// Create collections for commands and buttons
client.commands = new Map();
client.buttons = new Map();

// Load command files from ./interactions/commands
const commandsPath = path.join(__dirname, 'interactions/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// Load button files from ./interactions/buttons
const buttonsPath = path.join(__dirname, 'interactions/buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    client.buttons.set(button.name, button);
}

/* Interaction handler */
client.on("interactionCreate", async (interaction) => {
    // Handle chat input commands (slash commands)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({ content: "Unknown command.", ephemeral: true });

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "There was an error executing this command.", ephemeral: true });
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId);
        if (!button) return interaction.reply({ content: "Unknown button action.", ephemeral: true });

        try {
            await button.execute(interaction);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "There was an error processing this button interaction.", ephemeral: true });
        }
    }
});

/*END INTERACTION HANDLER*/

/* Central function to handle all requests */
app.post('/api/ranker', (req, res) => rankHandler(req, res, client, GROUPID));


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


/* Register slash commands */
const commands = [];

// Push command data from each file into the commands array
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    // Ensure the command file has name, description, and options
    commands.push({
        name: command.name,
        description: command.description,
        options: command.options || [] // This should be included in the same command object
    });
}

// Create an instance of REST and register commands
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
// mongodb+srv://sennevangerven214:Senne09v@cluster0.mongodb.net/?retryWrites=true&w=majority

mongoose.connect('mongodb+srv://sennevangerven214:Senne09v@cluster0.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(error => console.error("MongoDB connection error:", error));
    
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Website is running on http://${HOSTNAME}:${port}`);
});

// Log in the Discord client  
client.login(TOKEN);

// Start noblox app
startApp();