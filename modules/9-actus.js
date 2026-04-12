const newsManager = require('../news_manager');
const newsConfig = require('../news_config_manager');

async function getSection(date) {
    try {
        if (!process.env.NEWS_API_KEY) {
            console.log('⚠️  Module actualités désactivé: NEWS_API_KEY non configurée');
            return null;
        }

        const newsSection = await newsManager.getDailyNewsSection();
        return newsSection || null;
    } catch (error) {
        console.error('Erreur module actualités:', error);
        return null;
    }
}

module.exports = {
    getSection
};
