require("dotenv").config();
const express = require('express');
const noblox = require("noblox.js");
const axios = require("axios");
const app = express();
const {Client, IntentsBitField, ActivityType, GuildEmoji, EmbedBuilder, Guild, Embed, ActionRowBuilder, ButtonBuilder, ButtonStyle, Component} = require("discord.js");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildEmojisAndStickers
    ]
});

client.on("ready", async (c) =>{
    try {
        const RankChannel = client.channels.cache.get("1249787149184798751")
        if (!RankChannel) return;

		const del = new ButtonBuilder()
			.setCustomId('delete-reply-bot-notif-ranking')
			.setLabel('Remove Reply')
			.setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(del);

        const Embed1 = new EmbedBuilder()
            .setTitle("BOT NOTIF")
            .setDescription("App Active 🌟")
            .setColor("#3fb0e2")
            .setFooter({ text: "VBA BOT" })
            .setTimestamp(Date.now());

        await RankChannel.send({
            embeds: [ Embed1 ],
            components: [ row ] 
        });
    } catch (error) {
        console.log(error)
    }
});

client.login(process.env.TOKEN);