/*/

Used to connect Discord Members to the database and assign a UserId to them
for easy acces, this allows us to attach (temporary) data to a certain user if we ever
need it again.

/*/

module.exports = {
    name: 'connect',
    description: 'Connect your Discord Account to our bot.',
    async execute(interaction) {
        try {
            //await interaction.reply({ content: "Processing...", ephemeral: true });
            await interaction.reply({ content: "You can't use this command!", ephemeral: true });
        } catch (error) {
            console.error("Error with connect command:", error);
            await interaction.editReply({ content: "An error occurred while connecting your account.", ephemeral: true });
        }
    }
};
