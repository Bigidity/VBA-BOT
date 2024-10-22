const noblox = require("noblox.js");

async function checkValidity(params) {
};

module.exports = {
    name: 'rank',
    description: 'Rank a Roblox User (This is a secured action)',
    options: [
        {
            name: 'roblox user',
            type: 3,
            description: 'The user to rank',
            required: true,
        },
        {
            name: 'rank name',
            type: 3,
            description: 'The rank to assign',
            required: true,
        }
    ],
    async execute(interaction) { 
        await interaction.reply({ content: "Processing...", ephemeral: true });
        
        const isValid = await checkValidity(interaction.options);
        
        // If the validity check fails, edit the original reply
        if (!isValid) {
            return interaction.editReply({ content: "You can't rank this player! (Validity check failed)" });
        }
        interaction.editReply({ content: "You can't use this!", ephemeral: true });
    } 
};