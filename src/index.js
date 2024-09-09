require("dotenv").config();
const express = require('express');
const noblox = require("noblox.js");
const axios = require("axios");
const app = express();
const {Client, IntentsBitField, ActivityType, GuildEmoji, EmbedBuilder, Guild} = require("discord.js");

const version = "1.1.0";
const port = process.env.PORT;
const GROUPID = process.env.GROUP_ID;
const COOKIE = process.env.RBX_COOKIE;

//console.log("RBX_COOKIE:", process.env.RBX_COOKIE);

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildEmojisAndStickers
    ]
});

var guild = null;

function getRandomArbitrary(min, max) { // got it from StackOverflow
    return Math.random() * (max - min) + min;
};

app.use(express.json());

client.on("ready", (c) =>{
    console.log(`😎👍 ${c.user.tag} is online!`)
    guild = client.guilds.cache.get("1237150326092726335");

    let status = [
        {
            name: `over Members 🕵️`,
            type: ActivityType.Watching,
        },
        {
            name: `over ROBLOX Group`,
            type: ActivityType.Watching,
        },
        {
            name: `Running on version: ${version} 😎`,
            type: ActivityType.Playing
        },
        {
            name: `over channels 🤖`,
            type: ActivityType.Watching
        },
    ]

    setInterval(() => {
        let random = Math.floor(Math.random() * status.length);
        client.user.setActivity(status[random]);
    }, 10000);
});

async function startApp() {
    try {
        const currentUser = await noblox.setCookie(COOKIE);
        console.log(`Logged in as ${currentUser.name}`);
    } catch (error) {
        console.error("Failed to start app:", error);
        process.exit(1);  // Exit the app if it fails to authenticate
    }
};

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()){
        if (interaction.commandName === "coinflip") {
            let result = Math.ceil(getRandomArbitrary(0,2))
            let headOrTails = null
    
            if (result === 1) {
                headOrTails = "Tails"
            } else if (result == 2){
                headOrTails = "Heads"
            };
    
            interaction.reply({
                content: `You flipped ${headOrTails}!`,
                ephemeral: false,    
            })
        };
    }else if (interaction.isButton()){
        console.log(interaction.customId)
        if (interaction.customId === "delete-reply-bot-notif-ranking"){
            await interaction.reply({ content: "Deleted Reply", ephemeral: true })
            await interaction.message.delete();
        };
    };
});

app.post('/rank', async (req, res) => {
    const { userId, rankId, channelId } = req.body;
    const channel = client.channels.cache.get(channelId);
    
    try {
        const SuccesEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Player Promoted')
            .setDescription(`UserId: ${userId} has been promoted to RankId: ${rankId}`)
            .setTimestamp();

        const FailEmbed = new EmbedBuilder()
            .setTitle('Player Promotion Failed')
            .setDescription(`UserId: ${userId} has failed to be promoted to RankId: ${rankId}`)
            .setTimestamp();

        if (!channel) throw new Error('Channel not found');

        await channel.send({ embeds: [SuccesEmbed] });

        return res.status(200).json({   
            success: true,
            message: `User ${userId} ranked to ${rankId} and notified on Discord.`
        });
    } catch (error) {
        console.error('Error ranking player:', error);
        await channel.send({ embeds: [FailEmbed] });
        return res.status(400).json({
            success: false,
            message: error.message || 'An unexpected error occurred.'
        });
    }
});


client.login(process.env.TOKEN);
startApp();

app.listen(port, () => {
    console.log(`VSCode server is running on port ${port}`);
});