/* ********************************************* */
/*                                               */
/*                 Partie Discord                */
/*         Ce n'est pas du tout terminé !        */
/*                                               */
/* ********************************************* */

require('dotenv').config();
const { token } = process.env;
const { Client, Collection, Partials } = require('discord.js')
const {User, Message, GuildMember, ThreadMember, Channel, Reaction, GuildScheduledEvent} = Partials;

const client = new Client({ intents: '3276799', partials: [User, Message, GuildMember, ThreadMember, Channel, Reaction, GuildScheduledEvent ] });

const tempsavantminuit = () => {
    const now = new Date();
    const minuit = new Date();

    minuit.setHours(24, 0, 0, 0);

    const tempsavantminuit = minuit - now;

    return tempsavantminuit;
};

client.on('ready', async() => {
    console.log(`${client.user.username} is ready !`)
    const millisecondes = tempsavantminuit();
    setTimeout(async () => {
        const date = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
        const options2 = { day: 'numeric', month: 'long' };
        const formattedDate2 = new Intl.DateTimeFormat('fr-FR', options2).format(date);

        console.log(`Nous sommes le ${formattedDate} !`);
        console.log(`:tada: Bon anniversaire à ceux qui sont nés un ${formattedDate2} ! :birthday:`)
    }, millisecondes)
})


client.login(token);