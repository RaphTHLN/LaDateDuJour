/* ********************************************* */
/*                                               */
/*                 Partie Discord                */
/*                                               */
/* ********************************************* */

require('dotenv').config();
const { token } = process.env;
const { Client, Collection, Partials } = require('discord.js');
const { SearchOnThisDay } = require('./retrieve_wikipedia');
const {User, Message, GuildMember, ThreadMember, Channel, Reaction, GuildScheduledEvent} = Partials;
const channelid = "1240001870865498184";
const roleid = "1167616651265577003";

const client = new Client({ intents: '3276799', partials: [User, Message, GuildMember, ThreadMember, Channel, Reaction, GuildScheduledEvent ] });

const tempsavantminuit = () => {
    const now = new Date();
    const minuit = new Date();

    minuit.setHours(24, 0, 0, 0);

    const tempsavantminuit = minuit - now;

    return tempsavantminuit;
};
function Top3(data) {
    return data
        .sort((a, b) => b.popularite - a.popularite)
        .slice(0, 3)
        .sort((a, b) => a.annee - b.annee);
}

client.on('ready', async() => {
    console.log(`${client.user.username} is ready !`)

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
    const options2 = { day: 'numeric', month: 'long' };
    const formattedDate2 = new Intl.DateTimeFormat('fr-FR', options2).format(date);

    const channel = await client.channels.fetch(channelid);
    const ladatedujour = await SearchOnThisDay()

    const topEvenements = ladatedujour.elementshistoriques
        .sort((a, b) => b.year - a.year)
        .slice(0, 4)
        .sort((a, b) => a.year - b.year)
        .map(evenements => `**${evenements.year}** : ${evenements.text}`)
        .join('\n\n');

    const topMorts = Top3(ladatedujour.deaths)
        .map(mort => `**${mort.year}** : ${mort.name} ${mort.description} *( Popularité: ${mort.popularity} )*`)
        .join('\n\n');

    const topNaissances = Top3(ladatedujour.births)
        .map(naissance => `**${naissance.year}** : ${naissance.name} ${naissance.description} *( Popularité: ${naissance.popularity} )*`)
        .join('\n\n');

    const topFetes = ladatedujour.holidays
        .map(fete => `${fete.text}`)
        .join('\n\n');

    const millisecondes = tempsavantminuit();

    setTimeout(async () => {
        await channel.send(`# Nous sommes le ${formattedDate} ! <a:cat:1310685205547323432>\n
## Bon anniversaire à ceux qui sont nés un ${formattedDate2} ! :tada:\n


### - Événements historiques :

${topEvenements}

### - Anniversaires :

${topNaissances}

### - Décès :

${topMorts}

### - Fêtes et Journées Internationales :

${topFetes}

### - Sources :

Tout : [Wikipédia](<https://fr.wikipedia.org/wiki/>)
Popularité : [Google Trends](<https://trends.google.fr/trends/>)


**Envoyé par : <@${client.user.id}>**

||<@&${roleid}>||`)
    }, millisecondes)
})


client.login(token);