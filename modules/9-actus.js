const newsManager = require('../news_manager');

async function getSection(date, options = {}) {
    try {
        if (!process.env.NEWS_API_KEY) {
            console.log('⚠️  Module actualités désactivé: NEWS_API_KEY non configurée');
            return null;
        }

        const content = await newsManager.getDailyNewsSection({ date, fallbackAI: options.fallbackAI });
        return content ? { id: 'news', title: '🗞️ LES ACTUS DU JOUR', content } : null;
    } catch (error) {
        console.error('Erreur module actualités:', error);
        throw error;
    }
}

module.exports = {
    getSection
};
