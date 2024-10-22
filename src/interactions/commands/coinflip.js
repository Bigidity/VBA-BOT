module.exports = {
    name: 'coinflip',
    description: 'Flip a coin!',
    async execute(interaction) { 
        const result = Math.ceil(Math.random() * 2);
        const headOrTails = result == 1 ? 'Tails' : 'Heads';
        interaction.reply({ content: `You flipped ${headOrTails}!`, ephemeral: false});
    }
};