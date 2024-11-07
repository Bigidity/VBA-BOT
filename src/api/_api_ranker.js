const noblox = require('noblox.js');
const { EmbedBuilder } = require('discord.js');
const now = require('performance-now');

module.exports = async (req, res, client, GROUPID) => {
    const { userId, rankId } = req.body;
    console.log('Received rank request:', { userId, rankId });

    const channel = client.channels.cache.get("undefined"); // Discord channel ID

    const startTime = now(); // Start timing here

    try {
        if (!userId || !rankId) throw new Error('userId or rankId is missing or undefined');
        if (!channel) throw new Error('Discord channel not found');

        const currentUser = await noblox.setCookie(process.env.RBX_COOKIE);
        console.log(`Logged in as ${currentUser.name}`);

        const xcsrfToken = await noblox.getGeneralToken();
        if (!xcsrfToken) throw new Error("Failed to retrieve X-CSRF-TOKEN");
        console.log('Retrieved X-CSRF-TOKEN:', xcsrfToken);

        await noblox.setRank(GROUPID, userId, rankId);

        const endTime = now();
        const responseTime = (endTime - startTime).toFixed(2);

        const SuccessEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Player Promoted')
            .setDescription(`UserId: ${userId} has been promoted to RankId: ${rankId}`)
            .setFooter({ text: 'Response Time', value: `${responseTime} ms` })
            .setTimestamp();

        await channel.send({ embeds: [SuccessEmbed] });

        return res.status(200).json({
            success: true,
            message: `User ${userId} ranked to ${rankId} and notified on Discord.`,
            responseTime: `${responseTime} ms`
        });
    } catch (error) {
        console.error('Error ranking player:', error);

        const endTime = now();
        const responseTime = (endTime - startTime).toFixed(2);

        const FailEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Player Promotion Failed')
            .setDescription(`Failed to promote UserId: ${userId} to RankId: ${rankId}. Error: ${error.message}`)
            .setFooter({ text: 'Response Time', value: `${responseTime} ms` })
            .setTimestamp();

        if (channel) await channel.send({ embeds: [FailEmbed] });

        return res.status(400).json({
            success: false,
            message: error.message,
            responseTime: `${responseTime} ms`
        });
    }
};
