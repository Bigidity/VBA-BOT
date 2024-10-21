require('dotenv').config();

module.exports = {
    name: 'version',
    description: 'Get the most recent version!',
    execute(interaction) {
        interaction.reply({ content: `I'm running on version ${process.env.VERSION}` })
    }
};