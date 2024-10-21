const noblox = require("noblox.js");

async function checkValidity(params) {
};

module.exports = {
    name: 'rank',
    description: 'Rank a Roblox User (This is a secured action)',
    options: [
        {
            name: 'Roblox User',
            type: 'STRING',
            description: 'The user to rank',
            required: true,
        },
        {
            name: 'Rank Name',
            type: 'STRING',
            description: 'The rank to assign',
            required: true,
        }
    ],
    execute(interaction) { 
//        if (!checkValidity) {return;};
        interaction.reply({ content: "You cant use this!", ephemeral: true })
    }
};