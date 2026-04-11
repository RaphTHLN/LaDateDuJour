const { getWikipediaDeaths } = require('../wikipedia_helper');
const { evaluateRelevance } = require('../gemma_local_helper');
const { getCache, setCache } = require('../cache_manager');

module.exports.getSection = async (date, ladatedujour) => {
    try {
        const jour = date.getDate();
        const mois = date.getMonth() + 1;

        // Vérifier le cache d'abord
        let deces = getCache(jour, mois, 'deaths');

        if (!deces) {
            console.log('Récupération des décès depuis Wikipedia...');
            const wikipediaData = await getWikipediaDeaths(date);

            if (wikipediaData.length === 0) {
                return '';
            }

            // Évaluer la pertinence avec l'IA locale
            deces = await evaluateRelevance(wikipediaData, 'death');

            // Sauvegarder en cache
            setCache(jour, mois, 'deaths', deces);
        }

        // Trier par popularité décroissante, prendre les 3 premiers, puis trier par année croissante
        const topMorts = deces
            .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
            .slice(0, 3)
            .sort((a, b) => (a.year || 0) - (b.year || 0))
            .map(mort => `**${mort.year}** : [${mort.name}](<${mort.url}>) ${mort.description}`)
            .join('\n\n');

        return "### - Décès : \n" + topMorts;
    } catch (error) {
        console.error('Erreur dans le module décès:', error);
        return '';
    }
};