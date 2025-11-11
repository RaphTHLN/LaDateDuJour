const fs = require('fs');
const path = require('path');
const db = require('../database_manager');





module.exports.getSection = async (date) => {
    const events = db.getServerEvents(date.getDate(), date.getMonth() + 1);
    if (!events || events.length === 0) {
        return "";
    }

    const eventsText = events
        .map(e => `**${e.annee}** : ${e.description}`)
        .join('\n');

    return eventsText;
}

