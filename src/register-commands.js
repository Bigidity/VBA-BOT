import { REST, Routes } from "discord.js";

const commands = [
    {
        name: "coinflip",
        description: "Flip a coin!",
    },
    {
        name: "meme",
        description: "Replies with a random meme!",
    },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");

        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID),
            { body: commands },   
        )

        console.log("Slash ocmmands were registered succesfully!");
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();