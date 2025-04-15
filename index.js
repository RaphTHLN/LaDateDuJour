/* ********************************************* */
/*                                               */
/*                 Partie Discord                */
/*                    Terminé                    */
/*                                               */
/* ********************************************* */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { token } = process.env;
const config = fs.existsSync("./config.json") ? require("./config.json") : {}
const { Client, ActivityType, AttachmentBuilder } = require('discord.js');
const { searchOnThisDay } = require('./retrieve_wikipedia');
const channelId = config.channelId ?? "907720804316368956";
const roleId = config.roleId ?? "1167616651265577003";
const birthdaynamefile = './anniversaires.json';
const evenementsnamefile = './evenements_historiques.json';
const acnhDB = JSON.parse(
               fs.readFileSync(path.join(__dirname, 'acnh_database.json'), 'utf-8')
             );

const client = new Client({ intents: 0 });

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

function getTop3(data) {
    return data
        .sort((a, b) => b.popularite - a.popularite)
        .slice(0, 3)
        .sort((a, b) => a.annee - b.annee);
}
function getVillagerBirthday(AcnhDB, date = new Date()) {

  const mois = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = String(today.getDate()).padStart(2, '0');
  const monthName = mois[date.getMois()];
  
  const villagers = AcnhDB[monthName]?.[day];
  if (villagers) {
  return villagers.includes(" et ")
    ? villagers.split (" et ").map(name => name.trim ())
    : [villagers];
    } else {
    return[];
    }
}
async function checkBirthdays() {

    const birthdayfile = JSON.parse(fs.readFileSync(birthdaynamefile, 'utf8'));
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    let results = [];

    birthdayfile.forEach(user => {
        if (user.jour === todayDay && user.mois === todayMonth) {
            let age = null;
            if (user.annee) {
                age = user.annee
            }
            results.push({
                identifiant: user.identifiant,
                age: age,
                genre: user.genre
            });
        }
    });

    if (results.length > 0) {
        return results;
    } else {
        return null;
    }
}; 

async function checkEvenements() {

    const evenementsfile = JSON.parse(fs.readFileSync(evenementsnamefile, 'utf8'));
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    let results = [];

    evenementsfile.forEach(evenement => {
        if (evenement.jour === todayDay && evenement.mois === todayMonth) {
            results.push({
                annee: evenement.annee,
                text: evenement.texte
            });
        }
    });

    if (results.length > 0) {
        return results;
    } else {
        return null;
    }
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
        }else{
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
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const options2 = { day: 'numeric', month: 'long' };

    const channel = await client.channels.fetch(channelId);
    const ladatedujour = await searchOnThisDay();
    const anniversaires = await checkBirthdays();
    const evenements = await checkEvenements();

    const topEvenements = ladatedujour.elementshistoriques
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
        .sort((a, b) => a.year - b.year)
        .map(evenements => `**${evenements.year}** : ${evenements.text}`)
        .join('\n\n');

    const topMorts = getTop3(ladatedujour.deaths)
        .map(mort => `**${mort.year}** : [${mort.name}](<${mort.url}>) ${mort.description}`)
        .join('\n\n');

    const topNaissances = getTop3(ladatedujour.births)
        .map(naissance => `**${naissance.year}** : [${naissance.name}](<${naissance.url}>) ${naissance.description}`)
        .join('\n\n');

    const topFetes = ladatedujour.holidays
        .map(fete => `${fete.text}`)
        .join('\n\n');
    
    const acMessage = getVillagerBirthday > 0
        ? `\n### - 🎉 Sur **Animal Crossing** c'est l'anniversaire de \n\n${acBirthdays.map(n => `- ${n}`).join('\n')}\n`
        : '';
    
    let anniversairesMessage = '';
    if (anniversaires !== null) {
        for (const element of anniversaires) {
            anniversairesMessage += `**${element.age ? element.age : '????'}** : C'est l'anniversaire de <@${element.identifiant}>\n`;
        }
        anniversairesMessage += '\n'
    }

    let evenementsMessage = '';
    if (evenements !== null) {
        for (const element of evenements) {
            evenementsMessage += `**${element.annee}** : ${element.text}\n`;
        }
        evenementsMessage += '\n'
    }

    const weatherImageURL = getWeatherImageURL();

    const message = `||<@&${roleId}>||
# Nous sommes le ${date.toLocaleDateString("fr-FR", options)} ! <a:cat:1310685205547323432>\n
## Bon anniversaire à ceux qui sont nés un ${date.toLocaleDateString("fr-FR", options2)} ! :tada:\n
(first lol)\n

### - Événements historiques :  

${topEvenements}  

${evenementsMessage}### - Anniversaires :  

${topNaissances}  

${anniversairesMessage}${acMessage}### - Décès :  

${topMorts}  

### - Fêtes et Journées Internationales :  

${topFetes}  

### - Sources :  

Tout : [Wikipédia](<https://fr.wikipedia.org/wiki/>)  
Popularité : [Google Trends](<https://trends.google.fr/trends/>)  
Météo : [Météo Express](<https://meteo-express.com/>)  


**Envoyé par : <@${client.user.id}>**`

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
    laDateDuJour();
});
client.login(token);
