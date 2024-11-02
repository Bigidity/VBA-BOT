require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const noblox = require("noblox.js");

const GROUPID = process.env.GROUP_ID;
const HQRoleId = "1237150326168096914"

async function startApp() {
    await noblox.setCookie(process.env.COOKIE);
};

async function SendHQCheck(RankerInfo,TargetInfo) {
    const ChannelId = "1264255128505024623"
    const HQCheckEmbed = new EmbedBuilder()
};

module.exports = {
    name: 'rank',
    description: 'Rank a Roblox User (This is a secured action)',
    options: [
        {
            name: 'roblox-user',
            type: 3,
            description: 'The user to rank',
            required: true,
        },
        {
            name: 'rank-name',
            type: 3,
            description: 'The rank to assign',
            required: true,
        }
    ],
    async execute(interaction) {
        const user = interaction.user;
         await interaction.reply({ content: "Processing...", ephemeral: true })
        // We start our app
        startApp()

        // Then we get all the need info about the Target player.
        

        try {
            await noblox.setRank(GROUPID, userId, rankId);
         } catch (error) {
                await interaction.editReply({ content: "An error occurred while ranking the player.", ephemeral: true });
         }

         await interaction.editReply({ content: "Target player has been ranked!", ephemeral: true });
        //await interaction.editReply({ content: "Action has been recorded and sent for approval!", ephemeral: true });
    }
};