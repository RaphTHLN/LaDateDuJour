/* ********************************************* */
/*                                               */
/*                 Partie Discord                */
/*                    Terminé                    */
/*                                               */
/* ********************************************* */

require('dotenv').config();
const { token } = process.env;
const fs = require('fs');
const { Client, ActivityType } = require('discord.js');
const { SearchOnThisDay } = require('./retrieve_wikipedia');
const channelid = "907720804316368956";
const roleid = "1167616651265577003";
const birthdaynamefile = './anniversaires.json';
const evenementsnamefile = './evenements_historiques.json';

const client = new Client({ intents: 0 });

const tempsavantminuit = () => {
    const now = new Date();
    const minuit = new Date();
    minuit.setHours(24, 0, 0, 0);
    return minuit - now;
};
// Raph : J'ai ajouté sa, j'ai tréés peur de casser le code ;(
const getWeatherImageURL = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); 

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Format MM
    const day = String(today.getDate()).padStart(2, '0'); // Format DD

    return `https://meteo-express.com/wp-content/uploads/${year}/${month}/${month}-${day}matin.png`;
};

function Top3(data) {
    return data
        .sort((a, b) => b.popularite - a.popularite)
        .slice(0, 3)
        .sort((a, b) => a.annee - b.annee);
}

const checkBirthdays = async () => {

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

const checkEvenements = async () => {

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

async function laDateDuJour(){
    console.log("Démarrage de la création du message pour demain.")
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
    const options2 = { day: 'numeric', month: 'long' };
    const formattedDate2 = new Intl.DateTimeFormat('fr-FR', options2).format(date);

    const channel = await client.channels.fetch(channelid);
    const ladatedujour = await SearchOnThisDay();
    const anniversaires = await checkBirthdays();
    const evenements = await checkEvenements();

    const topEvenements = ladatedujour.elementshistoriques
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
        .sort((a, b) => a.year - b.year)
        .map(evenements => `**${evenements.year}** : ${evenements.text}`)
        .join('\n\n');

    const topMorts = Top3(ladatedujour.deaths)
        .map(mort => `**${mort.year}** : [${mort.name}](<${mort.url}>) ${mort.description}`)
        .join('\n\n');

    const topNaissances = Top3(ladatedujour.births)
        .map(naissance => `**${naissance.year}** : [${naissance.name}](<${naissance.url}>) ${naissance.description}`)
        .join('\n\n');

    const topFetes = ladatedujour.holidays
        .map(fete => `${fete.text}`)
        .join('\n\n');
    
    let anniversairesMessage = '';
    if(anniversaires !== null){
        for (const element of anniversaires) {
            anniversairesMessage += `**${element.age ? element.age : '????'}** : C'est l'anniversaire de <@${element.identifiant}>\n`;
        }
        anniversairesMessage += '\n'
    }

    let evenementsMessage = '';
    if(evenements !== null){
        for (const element of evenements) {
            evenementsMessage += `**${element.annee}** : ${element.text}\n`;
        }
        evenementsMessage += '\n'
    }

    const weatherImageURL = getWeatherImageURL();

    const message = `||<@&${roleid}>||
# Nous sommes le ${formattedDate} ! <a:cat:1310685205547323432>  

## Bon anniversaire à ceux qui sont nés un ${formattedDate2} ! :tada:  

### - Événements historiques :  

${topEvenements}  

${evenementsMessage}### - Anniversaires :  

${topNaissances}  

${anniversairesMessage}### - Décès :  

${topMorts}  

### - Fêtes et Journées Internationales :  

${topFetes}  

### - Météo du jour :  
![Carte météo](<${weatherImageURL}>)  

### - Sources :  

Tout : [Wikipédia](<https://fr.wikipedia.org/wiki/>)  
Popularité : [Google Trends](<https://trends.google.fr/trends/>)  
Météo : [Météo Express](<https://meteo-express.com/>)  

**Envoyé par : <@${client.user.id}>**`;

    const millisecondes = tempsavantminuit();

    console.log(`Message préparé, ${millisecondes}ms à attendre...`)

    setTimeout(async () => {
        const splitParts = splitText(message)

        for (const [index, part] of splitParts.entries()) {
            await channel.send(part);
            console.log(`Partie ${index + 1} envoyée :)`);
        }
        console.log('Les messages sont envoyés')
        setTimeout(async () => {
            laDateDuJour()
        }, 60000)
    }, millisecondes)
}

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    try {
        await client.user.setPresence({
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
