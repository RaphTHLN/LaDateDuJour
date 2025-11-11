const fs = require("fs");
// Crée le dossier 'data' s'il n'existe pas
const dir = './data';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const db = require('better-sqlite3')('data/database.db', { verbose: console.log });

/**
 * Initialise la base de données.
 * Crée la table 'anniversaires' si elle n'existe pas.
 */
function init() {
    try {
        db.pragma('journal_mode = WAL');

        const createTableStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS anniversaires (
                user_id TEXT PRIMARY KEY,
                jour INTEGER NOT NULL,
                mois INTEGER NOT NULL,
                annee INTEGER
            );
        `);
        createTableStmt.run();

        db.prepare(`
            CREATE TABLE IF NOT EXISTS server_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jour INTEGER NOT NULL,
                mois INTEGER NOT NULL,
                annee INTEGER NOT NULL,
                description TEXT NOT NULL
            );
        `).run();

        console.log("Base de données initialisée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de données :", error);
    }
}

/**
 * Récupère les anniversaires pour un jour et un mois donnés.
 * @param {number} jour Le jour à rechercher.
 * @param {number} mois Le mois à rechercher.
 * @returns {Array<{ user_id: string, annee: number, jour: number, mois: number }>} Un tableau des utilisateurs dont c'est l'anniversaire.
 */
function getBirthday(jour, mois) {
    try {
        const stmt = db.prepare(
            `SELECT user_id, annee, jour, mois 
            FROM anniversaires 
            WHERE (jour = ? OR ? IS NULL) 
            AND (mois = ? OR ? IS NULL)`);
        const rows = stmt.all(jour, jour, mois, mois); 
        
        // .all() retourne tous les résultats
        return rows;
    } catch (error) {
        console.error("Erreur lors de la récupération des anniversaires :", error);
        return []; // Retourner un tableau vide en cas d'erreur
    }
}
function addOrUpdateBirthday(userId, jour, mois, annee) {
    // 'INSERT ... ON CONFLICT' permet de faire un 'UPSERT' (UPDATE or INSERT)
    // Si user_id existe déjà, il met à jour la ligne, sinon il l'insère.
    const stmt = db.prepare(`
        INSERT INTO anniversaires (user_id, jour, mois, annee) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            jour = excluded.jour,
            mois = excluded.mois,
            annee = excluded.annee;
    `);
    stmt.run(userId, jour, mois, annee);
}

/**
 * Récupère l'anniversaire d'un utilisateur spécifique.
 * @param {string} userId
 * @returns {object | null} L'anniversaire trouvé ou null.
 */
function getBirthdayForUser(userId) {
    const stmt = db.prepare('SELECT jour, mois, annee FROM anniversaires WHERE user_id = ?');
    return stmt.get(userId); // .get() retourne la première ligne trouvée
}

/**
 * Supprime l'anniversaire d'un utilisateur.
 * @param {string} userId
 * @returns {object} Le résultat de l'opération de la base de données.
 */
function deleteBirthday(userId) {
    const stmt = db.prepare('DELETE FROM anniversaires WHERE user_id = ?');
    return stmt.run(userId);
}

/**

 * Récupère les événements du serveur pour un jour et un mois donnés.

 * @param {number} jour

 * @param {number} mois

 * @returns {Array<{ id: number, jour: number, mois: number, annee: number, description: string }>} Un tableau des événements de serveur.

 */
function getServerEvents(jour, mois) {
    try {
        const stmt = db.prepare(
            `SELECT id, jour, mois, annee, description
            FROM server_events
            WHERE (jour = ? OR ? IS NULL)
            AND (mois = ? OR ? IS NULL)`
        );
        const rows = stmt.all(jour, jour, mois, mois);

        return rows;
    } catch (error) {
        console.error("Erreur lors de la récupération des événements historiques :", error);
        return []; // Retourner un tableau vide en cas d'erreur
    }
}

/**
 * Ajoute un événement historique.
 * @param {number} jour
 * @param {number} mois
 * @param {number} annee
 * @param {string} description
 */
function addServerEvent(jour, mois, annee, description) {
    const stmt = db.prepare(`
        INSERT INTO server_events (jour, mois, annee, description)
        VALUES (?, ?, ?, ?)
    `);
    stmt.run(jour, mois, annee, description);
}

function deleteServerEvent(id) {
    const stmt = db.prepare('DELETE FROM server_events WHERE id = ?');
    return stmt.run(id);
}

// Initialisation automatique lors du chargement du module
init();

module.exports = {
    getBirthday,
    addOrUpdateBirthday,
    getBirthdayForUser,
    deleteBirthday,
    getServerEvents,
    addServerEvent,
    deleteServerEvent
};