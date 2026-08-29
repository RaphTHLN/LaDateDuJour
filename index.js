require('dotenv').config();
const fs = require('fs');
const {
    ActivityType,
    Client,
    IntentsBitField
} = require('discord.js');
const commandManager = require('./command_manager');
const configManager = require('./config_manager');
const { buildDailyMessages } = require('./daily_renderer');
const {
    finalizeDailyContent,
    prepareDailyContent
} = require('./daily_pipeline');
const { createDailyScheduler } = require('./daily_scheduler');

const config = fs.existsSync('./config.json') ? require('./config.json') : {};
const token = process.env.DISCORD_TOKEN || '';
const channelId = process.env.channelId || process.env.CHANNEL_ID || config.channelId;
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

function getActiveServers() {
    const servers = configManager.getAllActiveServers();
    if (servers.length || !channelId) return servers;
    return [{
        guild_id: 'default',
        channel_id: channelId,
        role_id: process.env.ROLE_ID || null,
        timezone: 'Europe/Paris'
    }];
}

async function sendPreparedMessage(server, sections, date) {
    const channel = await client.channels.fetch(server.channel_id);
    if (!channel?.isSendable()) {
        throw new Error(`Canal ${server.channel_id} introuvable ou non accessible`);
    }

    const payloads = buildDailyMessages({
        sections,
        date,
        roleId: server.role_id,
        botUserId: client.user.id
    });

    for (const [index, payload] of payloads.entries()) {
        await channel.send(payload);
        console.log(`Message ${index + 1}/${payloads.length} envoyé dans ${server.channel_id}`);
    }
}

async function sendDailyMessageManually() {
    console.log('=== ENVOI MANUEL DE LA DATE DU JOUR ===');
    const date = new Date();
    const preparation = await prepareDailyContent(date);
    const sections = await finalizeDailyContent(preparation);
    const servers = getActiveServers();

    if (!servers.length) {
        console.warn('Aucun canal configuré pour recevoir les messages.');
        return;
    }

    for (const server of servers) {
        try {
            await sendPreparedMessage(server, sections, date);
        } catch (error) {
            console.error(`Erreur lors de l'envoi au serveur ${server.guild_id}:`, error);
        }
    }
    console.log('=== FIN DE L’ENVOI MANUEL ===');
}

async function sendDailyMessageForServer(guildId) {
    const server = configManager.getServer(guildId);
    if (!server) {
        throw new Error('Aucun canal n’est configuré pour ce serveur. Utilisez /configurer canal.');
    }

    const date = new Date();
    const preparation = await prepareDailyContent(date);
    const sections = await finalizeDailyContent(preparation);
    await sendPreparedMessage(server, sections, date);

    return server;
}

const scheduler = createDailyScheduler({
    getServers: getActiveServers,
    prepare: prepareDailyContent,
    finalize: finalizeDailyContent,
    send: sendPreparedMessage
});

client.once('ready', async readyClient => {
    console.log(`${readyClient.user.username} is ready!`);
    readyClient.user.setPresence({
        activities: [{ name: 'préparer le calendrier 📅', type: ActivityType.Playing }],
        status: 'online'
    });
    await commandManager.init(readyClient);

    if (commandManager.isDevelopmentMode()) {
        await sendDailyMessageManually();
    } else {
        scheduler.start();
        console.log('Planificateur quotidien démarré (préparation locale à 23 h, envoi à minuit).');
    }
});

module.exports = {
    client,
    getActiveServers,
    scheduler,
    sendDailyMessageManually,
    sendDailyMessageForServer,
    sendPreparedMessage
};

if (require.main === module) {
    client.login(token).catch(error => {
        console.error('Échec de connexion à Discord:', error.code || error.message || error);
        process.exitCode = 1;
    });
}
