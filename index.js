/* ********************************************* */
/*                                               */
/*                 Partie Discord                */
/*         Ce n'est pas du tout terminé !        */
/*                                               */
/* ********************************************* */

require('dotenv').config();
const { token } = process.env;
const { Client, Collection, Partials } = require('discord.js');
const {User, Message, GuildMember, ThreadMember, Channel, Reaction, GuildScheduledEvent} = Partials;
const channelid = "1240001870865498184";

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

    const ladatedujour = { /* ladatedujour.json */ }

    const millisecondes = tempsavantminuit();
    setTimeout(async () => {
        const date = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
        const options2 = { day: 'numeric', month: 'long' };
        const formattedDate2 = new Intl.DateTimeFormat('fr-FR', options2).format(date);

        console.log(`Nous sommes le ${formattedDate} ! <a:cat:1310685205547323432>`);
        console.log(`:tada: Bon anniversaire à ceux qui sont nés un ${formattedDate2} ! :tada:`)
        const channel = await client.channels.fetch(channelid);

        const topEvenements = ladatedujour.evenements_historiques
            .sort((a, b) => a.annee - b.annee)
            .map(evenements => `**${evenements.annee}** : ${evenements.text}`)
            .join('\n\n');

        const topMorts = Top3(ladatedujour.morts)
            .map(mort => `**${mort.annee}** : ${mort.nom} ${mort.description} *( Popularité: ${mort.popularite} )*`)
            .join('\n\n');

        const topNaissances = Top3(ladatedujour.naissances)
            .map(naissance => `**${naissance.annee}** : ${naissance.nom} ${naissance.description} *( Popularité: ${naissance.popularite} )*`)
            .join('\n\n');

        const topFetes = ladatedujour.fetes
            .map(fete => `${fete.text}`)
            .join('\n\n');

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

Événements historiques, Anniversaires, Décès, Fêtes et Journées Internationales : Wikipédia.
Popularité : Google Trends


**Envoyé par : <@${client.user.id}>**

<@&1167616651265577003>`)
    }, millisecondes)
})


client.login(token);