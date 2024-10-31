require('dotenv').config();

module.exports = {
    name: 'version',
    description: 'Get the most recent version!',
    async execute(interaction) {
        try {
            const version = process.env.VERSION || "unknown version";
            await interaction.reply({ content: `I'm running on version ${version}`, ephemeral: true });
        } catch (error) {
            console.error("Error with connect command:", error);
            await interaction.reply({ content: "An error occurred while connecting your account.", ephemeral: true });
        }
    }
};
