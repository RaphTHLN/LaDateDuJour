const { CommandInteraction, Client, SlashCommandBuilder } = require("discord.js");

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder().setName("testcmd").setDescription("Test command"),
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    run: async (interaction, client) => {
        await interaction.guild.commands.fetch()
        interaction.reply(`Hello ! \nThis is ${client.user}, there is ${interaction.guild.commands.cache.size} registred commands in this guild. \n${new Date().toLocaleDateString()}`)
    }
}