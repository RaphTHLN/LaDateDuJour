const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dir = './data';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const db = new Database(path.join(dir, 'cache.db'));

/**
 * Initialise la table de cache
 */
function init() {
    try {
        db.pragma('journal_mode = WAL');

        db.prepare(`
            CREATE TABLE IF NOT EXISTS wikipedia_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jour INTEGER NOT NULL,
                mois INTEGER NOT NULL,
                type TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        db.prepare(`
            CREATE INDEX IF NOT EXISTS idx_date_type 
            ON wikipedia_cache(jour, mois, type);
        `).run();

        console.log("Cache database initialisée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'initialisation du cache :", error);
    }
}

function getCache(jour, mois, type, maxAgeHours = 24 * 7) {
    try {
        const stmt = db.prepare(`
            SELECT data, created_at FROM wikipedia_cache
            WHERE jour = ? AND mois = ? AND type = ?
            ORDER BY created_at DESC
            LIMIT 1
        `);

        const result = stmt.get(jour, mois, type);

        if (!result) {
            return null;
        }

        // Vérifier l'âge du cache
        const createdTime = new Date(result.created_at).getTime();
        const now = new Date().getTime();
        const ageHours = (now - createdTime) / (1000 * 60 * 60);

        if (ageHours > maxAgeHours) {
            console.log(`Cache expiré pour ${jour}/${mois}/${type} (${ageHours.toFixed(1)}h old)`);
            return null;
        }

        console.log(`Cache hit pour ${jour}/${mois}/${type}`);
        return JSON.parse(result.data);
    } catch (error) {
        console.error("Erreur lors de la lecture du cache:", error);
        return null;
    }
}
function setCache(jour, mois, type, data) {
    try {
        const stmt = db.prepare(`
            INSERT INTO wikipedia_cache (jour, mois, type, data)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(jour, mois, type, JSON.stringify(data));
        console.log(`Cache sauvegardé pour ${jour}/${mois}/${type}`);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du cache:", error);
    }
}

function cleanOldCache(maxAgeHours = 24 * 30) {
    try {
        const stmt = db.prepare(`
            DELETE FROM wikipedia_cache
            WHERE datetime(created_at) < datetime('now', '-' || ? || ' hours')
        `);

        const result = stmt.run(maxAgeHours);
        console.log(`Nettoyage du cache: ${result.changes} entrées supprimées`);
    } catch (error) {
        console.error("Erreur lors du nettoyage du cache:", error);
    }
}

function clearCache() {
    try {
        db.prepare('DELETE FROM wikipedia_cache').run();
        console.log("Cache vidé complètement");
    } catch (error) {
        console.error("Erreur lors du vidage du cache:", error);
    }
}

init();

module.exports = {
    getCache,
    setCache,
    cleanOldCache,
    clearCache
};

