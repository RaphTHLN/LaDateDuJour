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

        db.prepare(`
            CREATE TABLE IF NOT EXISTS news_config (
                guild_id TEXT PRIMARY KEY,
                enabled BOOLEAN DEFAULT 1,
                channel_id TEXT,
                post_hour INTEGER DEFAULT 8,
                post_minute INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        console.log("✓ Table news_config initialisée");
    } catch (error) {
        console.error("✗ Erreur lors de l'initialisation news_config:", error);
    }
}

function getNewsConfig(guildId) {
    try {
        const stmt = db.prepare('SELECT * FROM news_config WHERE guild_id = ?');
        return stmt.get(guildId) || null;
    } catch (error) {
        console.error("Erreur getNewsConfig:", error);
        return null;
    }
}

function setNewsConfig(guildId, channelId, postHour = 8, postMinute = 0, enabled = true) {
    try {
        // Validation de l'heure
        if (postHour < 0 || postHour > 23) postHour = 8;
        if (postMinute < 0 || postMinute > 59) postMinute = 0;

        const stmt = db.prepare(`
            INSERT INTO news_config (guild_id, channel_id, post_hour, post_minute, enabled)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                post_hour = excluded.post_hour,
                post_minute = excluded.post_minute,
                enabled = excluded.enabled,
                updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run(guildId, channelId, postHour, postMinute, enabled ? 1 : 0);
        console.log(`✓ Config actualités mise à jour pour ${guildId}`);
        return true;
    } catch (error) {
        console.error("Erreur setNewsConfig:", error);
        return false;
    }
}

function toggleNewsEnabled(guildId, enabled) {
    try {
        const stmt = db.prepare('UPDATE news_config SET enabled = ? WHERE guild_id = ?');
        stmt.run(enabled ? 1 : 0, guildId);
        console.log(`${enabled ? '✓ Actualités activées' : '✓ Actualités désactivées'} pour ${guildId}`);
        return true;
    } catch (error) {
        console.error("Erreur toggleNewsEnabled:", error);
        return false;
    }
}

function setNewsChannel(guildId, channelId) {
    try {
        const stmt = db.prepare('UPDATE news_config SET channel_id = ? WHERE guild_id = ?');
        stmt.run(channelId, guildId);
        console.log(`✓ Channel actualités changé pour ${guildId}`);
        return true;
    } catch (error) {
        console.error("Erreur setNewsChannel:", error);
        return false;
    }
}

function setNewsTime(guildId, hour, minute = 0) {
    try {
        // Validation
        if (hour < 0 || hour > 23) throw new Error("L'heure doit être entre 0 et 23");
        if (minute < 0 || minute > 59) throw new Error("Les minutes doivent être entre 0 et 59");

        const stmt = db.prepare('UPDATE news_config SET post_hour = ?, post_minute = ? WHERE guild_id = ?');
        stmt.run(hour, minute, guildId);
        console.log(`✓ Heure de publication changée: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        return true;
    } catch (error) {
        console.error("Erreur setNewsTime:", error);
        return false;
    }
}

function getEnabledNewsServers() {
    try {
        const stmt = db.prepare('SELECT * FROM news_config WHERE enabled = 1');
        return stmt.all();
    } catch (error) {
        console.error("Erreur getEnabledNewsServers:", error);
        return [];
    }
}

init();

module.exports = {
    getNewsConfig,
    setNewsConfig,
    toggleNewsEnabled,
    setNewsChannel,
    setNewsTime,
    getEnabledNewsServers
};
