const db = require('../database_manager');





module.exports.getSection = async (date) => {
    const events = db.getServerEvents(date.getDate(), date.getMonth() + 1);
    if (!events || events.length === 0) {
        return null;
    }

    const eventsText = events
        .map(e => `**${e.annee}** : ${e.description}`)
        .join('\n');

    return { id: 'server-events', title: 'Événements du serveur', content: eventsText };
}
