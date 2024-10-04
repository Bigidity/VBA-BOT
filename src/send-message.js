import express from 'express';
import noblox from "noblox.js";
const app = express();
import { Client, IntentsBitField, ActivityType, GuildEmoji, EmbedBuilder, Guild, Embed, ActionRowBuilder, ButtonBuilder, ButtonStyle, Component } from "discord.js";

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