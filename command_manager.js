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

    client.on("guildCreate", async (guild) => {
        try {
            console.log(`✓ Bot ajouté au serveur: ${guild.name} (${guild.id})`);
            await deployCommands(guild);
            console.log(`✓ Commandes déployées automatiquement sur ${guild.name}`);
        } catch (error) {
            console.error(`✗ Erreur lors du déploiement sur ${guild.name}:`, error);
        }
    });

    client.on("interactionCreate", interaction => {
        if (!interaction.isCommand()) return
        let cmd = slashCommands[interaction.commandName]
        if (cmd) {
            cmd.run(interaction, client)
        }
    })

    client.on("messageCreate", async (message) => {
        const prefix = "LDDJ!"
        const args = message.content.slice(prefix.length).split(/ +/)
        const command = args[0]?.toLowerCase()
        if (message.content === "LDDJ!deploy") {
            if (!config.devs.includes(message.member.id)) return message.channel.send({content:"Vous n'avez pas la permission"})
            if (!fs.existsSync("./slashCommands")) return message.channel.send("Aucune commande trouvée.")
            const count = await deployCommands(message.guild);
            message.channel.send(`${count} commandes ont été enregistrées.`)
        }
        else if (message.content === "LDDJ!send") {
            if (!config.devs.includes(message.member.id)) return message.channel.send({content:"Vous n'avez pas la permission"})
            try {
                await message.channel.send("🚀 Envoi de la date du jour sur tous les serveurs...");
                const { sendDailyMessageManually } = require("./index.js");
                await sendDailyMessageManually();
                await message.channel.send("✅ Envoi terminé avec succès!");
            } catch (err) {
                console.error("Erreur LDDJ!send:", err);
                await message.channel.send(`❌ Erreur: ${err.message}`);
            }
        }
        else if (command === "actusSend") {
            if (!config.devs.includes(message.member.id)) return message.channel.send({content:"Vous n'avez pas la permission"})

            try {
                const newsConfig = require("./news_config_manager");
                const newsManager = require("./news_manager");

                await message.channel.send("📰 Envoi des actualités sur tous les serveurs configurés...");

                const enabledServers = newsConfig.getEnabledNewsServers();

                if (enabledServers.length === 0) {
                    return message.channel.send("⚠️ Aucun serveur n'a les actualités configurées.");
                }

                let successCount = 0;
                let failCount = 0;

                for (const serverConfig of enabledServers) {
                    try {
                        const channel = await client.channels.fetch(serverConfig.channel_id);
                        const newsContent = await newsManager.getDailyNewsSection();
                        await channel.send(newsContent);
                        successCount++;
                        console.log(`✅ Actualités envoyées au serveur ${serverConfig.guild_id}`);
                    } catch (error) {
                        failCount++;
                        console.error(`❌ Erreur serveur ${serverConfig.guild_id}:`, error.message);
                    }
                }

                await message.channel.send(
                    `✅ **Actualités envoyées!**\n\n` +
                    `✓ Succès: ${successCount} serveur(s)\n` +
                    `✗ Échecs: ${failCount} serveur(s)`
                );
            } catch (err) {
                console.error("Erreur LDDJ!actusSend:", err);
                await message.channel.send(`❌ Erreur: ${err.message}`);
            }
        }
    })
}

async function deployCommands(guild) {
    let count = 0;
    for (const file of fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"))) {
        const cmd = require("./slashCommands/" + file)
        if (cmd.enabled) {
            await guild.commands.create(cmd.data.toJSON());
            count++;
        }
    }
    console.log(`${count} commandes déployées sur ${guild.name}`);
    return count;
}

module.exports = {init}
