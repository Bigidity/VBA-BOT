const noblox = require("noblox.js");

async function checkValidity(params) {
};

module.exports = {
    name: 'rank',
    description: 'Rank a Roblox User (This is a secured action)',
    options: [
        {
            name: 'roblox-user',
            type: 1,
            description: 'The user to rank',
        },
        {
            name: 'rank-name',
            type: 1,
            description: 'The rank to assign',
        }
    ],
    execute(interaction) { 
//        if (!checkValidity) {return;};
        interaction.reply({ content: "You cant use this!", ephemeral: true })
    }
};