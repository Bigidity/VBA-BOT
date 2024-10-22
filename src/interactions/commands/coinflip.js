module.exports = {
    name: 'coinflip',
    description: 'Flip a coin!',
    async execute(interaction) {
        try {
            const result = Math.ceil(Math.random() * 2);
            const headOrTails = result === 1 ? 'Tails' : 'Heads';
            await interaction.reply({ content: `You flipped ${headOrTails}!`, ephemeral: false });
        } catch (error) {
            console.error("Error with coinflip command:", error);
            await interaction.reply({ content: "An error occurred while flipping the coin.", ephemeral: true });
        }
    }
};
