const noblox = require("noblox.js");

async function checkValidity(params) {
};

module.exports = {
    name: 'rank',
    description: 'Rank a Roblox User (This is a secured action)',
    options: [
        {
            name: 'roblox-user',
            type: 3, // String type to input the Roblox user
            description: 'The user to rank',
            required: true, // Ensure this option is required
        },
        {
            name: 'rank-name',
            type: 3, // String type to input the rank name
            description: 'The rank to assign',
            required: true, // Ensure this option is required
        }
    ],
     async execute(interaction) { 
//        if (!checkValidity) {return;};
        interaction.reply({ content: "You cant use this!", ephemeral: true })
    }
};