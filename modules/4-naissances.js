const { getWikipediaBirths } = require('../wikipedia_helper');
const { evaluateRelevance } = require('../gemma_local_helper');
const { getCache, setCache } = require('../cache_manager');

module.exports.getSection = async (date, ladatedujour) => {
    try {
        const jour = date.getDate();
        const mois = date.getMonth() + 1;

        // Vérifier le cache d'abord
        let naissances = getCache(jour, mois, 'births');

        if (!naissances) {
            console.log('Récupération des naissances depuis Wikipedia...');
            const wikipediaData = await getWikipediaBirths(date);

            if (wikipediaData.length === 0) {
                return '';
            }

            // Évaluer la pertinence avec l'IA locale
            naissances = await evaluateRelevance(wikipediaData, 'birth');

            // Sauvegarder en cache
            setCache(jour, mois, 'births', naissances);
        }

        // Trier par popularité décroissante, prendre les 3 premiers, puis trier par année croissante
        const topNaissances = naissances
            .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
            .slice(0, 3)
            .sort((a, b) => (a.year || 0) - (b.year || 0))
            .map(naissance => `**${naissance.year}** : [${naissance.name}](<${naissance.url}>) ${naissance.description}`)
            .join('\n\n');

        return `### - Anniversaires :  

${topNaissances}`;
    } catch (error) {
        console.error('Erreur dans le module naissances:', error);
        return '';
    }
};