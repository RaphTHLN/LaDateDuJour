const { Client } = require("discord.js")
const fs = require("fs")
const slashCommands = {}
let config

/**
 * 
 * @param {Client} client 
 * @returns 
 */
function init(client) {
    config = fs.existsSync("./config.json") ? require("./config.json") : {}
    if (!config.devs) return console.warn("No dev id set in the config. \n Skipping command manager startup...")
    if (fs.existsSync("./slashCommands")) {
        for (const file of fs.readdirSync("./slashCommands").filter(name => name.endsWith(".js"))) {
            const command = require("./slashCommands/" + file)
            if (!command.enabled) continue
            console.log("Loaded " + file)
            slashCommands[file.split(".")[0]] = command
        }
    }
    
    client.on("interactionCreate", interaction => {
        if (!interaction.isCommand()) return
        let cmd = slashCommands[interaction.commandName]
        if (cmd) {
            cmd.run(interaction, client)
        }
    })

    client.on("messageCreate", (message) => {
        if (message.content !== "cal!deploy") return
        if (!config.devs.includes(message.member.id)) return message.channel.send({content:"Vous n'avez pas la permission"})
        if (!fs.existsSync("./slashCommands")) return message.channel.send("Aucune commande trouvée.")
        let i = 0
        for (const file of fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"))) {
            console.log("lecture de la commande " + file);
            const cmd = require("./slashCommands/" + file)
            if (cmd.enabled) {
                message.guild.commands.create(cmd.data.toJSON())
                i++
            }
        }
        message.channel.send(`${i} commandes ont été enregistrées.`)
        
    })
}



module.exports = {init}