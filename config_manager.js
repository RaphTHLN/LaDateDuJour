const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dir = './data';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const db = new Database(path.join(dir, 'config.db'));

function init() {
    try {
        db.pragma('journal_mode = WAL');

        // Table pour les serveurs configurés
        db.prepare(`
            CREATE TABLE IF NOT EXISTS servers (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                enabled BOOLEAN DEFAULT 1,
                role_id TEXT,
                timezone TEXT DEFAULT 'Europe/Paris',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        console.log("Config database initialisée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'initialisation du config :", error);
    }
}

function addOrUpdateServer(guildId, channelId, roleId = null, timezone = 'Europe/Paris') {
    try {
        const stmt = db.prepare(`
            INSERT INTO servers (guild_id, channel_id, role_id, timezone)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                role_id = excluded.role_id,
                timezone = excluded.timezone,
                updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run(guildId, channelId, roleId, timezone);
        console.log(`Serveur ${guildId} configuré`);
    } catch (error) {
        console.error("Erreur lors de l'ajout du serveur :", error);
    }
}


function getServer(guildId) {
    try {
        const stmt = db.prepare('SELECT * FROM servers WHERE guild_id = ? AND enabled = 1');
        return stmt.get(guildId);
    } catch (error) {
        console.error("Erreur lors de la récupération du serveur :", error);
        return null;
    }
}


function getAllActiveServers() {
    try {
        const stmt = db.prepare('SELECT * FROM servers WHERE enabled = 1');
        return stmt.all();
    } catch (error) {
        console.error("Erreur lors de la récupération des serveurs :", error);
        return [];
    }
}


function disableServer(guildId) {
    try {
        const stmt = db.prepare('UPDATE servers SET enabled = 0 WHERE guild_id = ?');
        stmt.run(guildId);
        console.log(`Serveur ${guildId} désactivé`);
    } catch (error) {
        console.error("Erreur lors de la désactivation du serveur :", error);
    }
}


function enableServer(guildId) {
    try {
        const stmt = db.prepare('UPDATE servers SET enabled = 1 WHERE guild_id = ?');
        stmt.run(guildId);
        console.log(`Serveur ${guildId} activé`);
    } catch (error) {
        console.error("Erreur lors de l'activation du serveur :", error);
    }
}


function deleteServer(guildId) {
    try {
        const stmt = db.prepare('DELETE FROM servers WHERE guild_id = ?');
        stmt.run(guildId);
        console.log(`Serveur ${guildId} supprimé`);
    } catch (error) {
        console.error("Erreur lors de la suppression du serveur :", error);
    }
}

init();

module.exports = {
    addOrUpdateServer,
    getServer,
    getAllActiveServers,
    disableServer,
    enableServer,
    deleteServer
};

