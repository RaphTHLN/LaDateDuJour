require('dotenv').config();
const fs = require('fs');
const path = require("path")
const config = fs.existsSync("./config.json") ? require("./config.json") : {}
const { Client, ActivityType, AttachmentBuilder, IntentsBitField } = require('discord.js');
const commandManager = require("./command_manager");
const configManager = require("./config_manager");
const token = process.env.DISCORD_TOKEN || '';
const channelId = process.env.channelId || process.env.CHANNEL_ID || config.channelId;
const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent] });
const modulesDir = path.join(__dirname, 'modules');
const moduleFiles = fs.readdirSync(modulesDir)
    .filter(file => file.endsWith('.js'))
    .sort((a, b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]));

function getTimeToMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
};

function getWeatherImageURL(targetDate = null) {
    const today = targetDate ? new Date(targetDate) : new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `https://meteo-express.com/wp-content/uploads/${year}/${month}/${month}-${day}aprem.png`;
};


function splitText(text, maxLength = 2000) {
    const parts = [];

    while (text.length > maxLength) {
        let splitIndex = text.lastIndexOf('\n', maxLength);

        if (splitIndex === -1) {
            splitIndex = maxLength;
        }

        parts.push(text.slice(0, splitIndex));

        text = text.slice(splitIndex).trimStart();
    }

    if (text) {
        parts.push(text);
    }

    return parts;
}

async function sendMessage(message, attachment, channel) {
    const splitParts = splitText(message)

    for (const [index, part] of splitParts.entries()) {
        if (index === splitParts.length - 1) {
            await channel.send({content: part, files: [attachment]})
        } else {
            await channel.send(part);
        }
        console.log(`Partie ${index + 1} envoyée :)`);
    }
    console.log('Les messages sont envoyés')
}

async function generateDailyMessage(targetDate = null) {
    const date = targetDate ? new Date(targetDate) : new Date();

    if (!targetDate) {
        console.log("Génération du message pour aujourd'hui...")
    } else {
        console.log(`Génération du message pour ${date.toLocaleDateString('fr-FR')}...`)
    }

    const messageParts = []
    for (const file of moduleFiles) {
        try {
            const module = require(path.join(modulesDir, file));
            if (module.getSection) {
                const section = await module.getSection(date);
                console.log(file, section ? "✓" : "✗")
                if (section) {
                    messageParts.push(section);
                }
            }
        } catch (error) {
            console.error(`Erreur sur le module ${file} :`, error);
        }
    }

    const footer = `

### - Sources :  

Tout : [Wikipédia](<https://fr.wikipedia.org/wiki/>)  
Météo : [Météo Express](<https://meteo-express.com/>)
Anniversaires Animal Crossing : [Animal Crossing Wiki](<https://animalcrossing.fandom.com/wiki/Animal_Crossing_Wiki/>)


**Envoyé par : <@${client.user.id}>**`
    messageParts.push(footer)
    return messageParts.join("\n\n");
}

async function laDateDuJour() {
    console.log("=== ENVOI DES MESSAGES QUOTIDIENS ===")

    const message = await generateDailyMessage();
    const weatherImageURL = getWeatherImageURL();
    const attachment = new AttachmentBuilder(weatherImageURL);

    let servers = configManager.getAllActiveServers();

    if (servers.length === 0 && channelId) {
        console.log("Aucun serveur en base de données, utilisation de la config .env");
        servers = [{
            guild_id: 'default',
            channel_id: channelId,
            role_id: process.env.ROLE_ID || null,
            timezone: 'Europe/Paris'
        }];
    }

    if (servers.length === 0) {
        console.warn("Aucun canal configuré pour recevoir les messages!");
        return;
    }

    for (const server of servers) {
        try {
            const channel = await client.channels.fetch(server.channel_id);
            if (!channel) {
                console.warn(`Canal ${server.channel_id} introuvable pour le serveur ${server.guild_id}`);
                continue;
            }

            console.log(`Envoi du message au canal ${server.channel_id}...`);
            await sendMessage(message, attachment, channel);

        } catch (error) {
            console.error(`Erreur lors de l'envoi au serveur ${server.guild_id}:`, error);
        }
    }

    console.log("=== FIN DE L'ENVOI ===")

    // Programmer le prochain envoi à minuit
    const milliseconds = getTimeToMidnight();
    console.log(`Prochain envoi dans ${(milliseconds / 1000 / 60 / 60).toFixed(2)} heures`);
    setTimeout(() => {
        laDateDuJour();
    }, milliseconds);
}

async function sendDailyMessageManually() {
    console.log("=== ENVOI MANUEL DE LA DATE DU JOUR ===")

    const today = new Date();
    const message = await generateDailyMessage(today);
    const weatherImageURL = getWeatherImageURL(today);
    const attachment = new AttachmentBuilder(weatherImageURL);

    let servers = configManager.getAllActiveServers();

    if (servers.length === 0 && channelId) {
        console.log("Aucun serveur en base de données, utilisation de la config .env");
        servers = [{
            guild_id: 'default',
            channel_id: channelId,
            role_id: process.env.ROLE_ID || null,
            timezone: 'Europe/Paris'
        }];
    }

    if (servers.length === 0) {
        console.warn("Aucun canal configuré pour recevoir les messages!");
        return;
    }

    for (const server of servers) {
        try {
            const channel = await client.channels.fetch(server.channel_id);
            if (!channel) {
                console.warn(`Canal ${server.channel_id} introuvable pour le serveur ${server.guild_id}`);
                continue;
            }

            console.log(`Envoi du message au canal ${server.channel_id}...`);
            await sendMessage(message, attachment, channel);

        } catch (error) {
            console.error(`Erreur lors de l'envoi au serveur ${server.guild_id}:`, error);
        }
    }

    console.log("=== FIN DE L'ENVOI MANUEL ===")
}

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    try {
        client.user.setPresence({
            activities: [
                {
                    name: 'préparer le calendrier 📅',
                    type: ActivityType.Playing,
                },
            ],
            status: 'online',
        });

        console.log('Statut mis à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
    }

    commandManager.init(client)

    if (process.env.DEBUG_MODE === "1") {
        laDateDuJour();
    } else {
        const milliseconds = getTimeToMidnight();
        console.log(`Prochain appel dans ${(milliseconds / 1000 / 60 / 60).toFixed(2)} heures`);
        setTimeout(() => {
            laDateDuJour();
        }, milliseconds);
    }
});

module.exports = {
    sendDailyMessageManually,
    client
};

client.login(token).catch(err => {
    console.error('Échec de connexion à Discord :', err.code || err.message || err);
    process.exit(1);
});
