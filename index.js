require('dotenv').config();
const fs = require('fs');
const path = require("path")
const { token } = process.env;
const config = fs.existsSync("./config.json") ? require("./config.json") : {}
const { Client, ActivityType, AttachmentBuilder, IntentsBitField } = require('discord.js');
const { searchOnThisDay } = require('./retrieve_wikipedia');
const channelId = config.channelId ?? "907720804316368956";
const commandManager = require("./command_manager")

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent] });


// Charger les modules de manière ordonnée
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

function getWeatherImageURL() {
    const today = new Date();
    today.setDate(today.getDate() + 1); 

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `https://meteo-express.com/wp-content/uploads/${year}/${month}/${month}-${day}matin.png`;
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
    setTimeout(async () => {
        laDateDuJour()
    }, 60000)
}



async function laDateDuJour() {
    console.log("Démarrage de la création du message pour demain.")
    const date = new Date();
    date.setDate(date.getDate() + 1);

    const channel = await client.channels.fetch(channelId);
    const wikidata = await searchOnThisDay();
   

    const weatherImageURL = getWeatherImageURL();
    const messageParts = []
    for (const file of moduleFiles) {
        try {
            const module = require(path.join(modulesDir, file));
            if (module.getSection) {
                const section = await module.getSection(date, wikidata);
                console.log(file, section)
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
Popularité : [Google Trends](<https://trends.google.fr/trends/>)  
Météo : [Météo Express](<https://meteo-express.com/>)
Anniversaires Animal Crossing : [Animal Crossing Wiki](<https://animalcrossing.fandom.com/wiki/Animal_Crossing_Wiki/>)


**Envoyé par : <@${client.user.id}>**`
    messageParts.push(footer)
    const message = messageParts.join("\n\n")
    const milliseconds = getTimeToMidnight();

    console.log(`Message préparé, ${milliseconds}ms à attendre...`)

    const attachment = new AttachmentBuilder(weatherImageURL);

    if (process.env.ISDEV === "1") {
        sendMessage(message, attachment, channel)
    } else {
        setTimeout(async () => {
            sendMessage(message, attachment, channel)
        }, milliseconds)
    }
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
    laDateDuJour();
});
client.login(token);
