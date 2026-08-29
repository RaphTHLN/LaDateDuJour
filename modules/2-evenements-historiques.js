const { getWikipediaEvents } = require('../wikipedia_helper');
const { getCache, setCache } = require('../cache_manager');

module.exports.getSection = async date => {
    try {
        const jour = date.getDate();
        const mois = date.getMonth() + 1;

        let evenements = getCache(jour, mois, 'events');

        if (!evenements) {
            console.log('Récupération des événements depuis Wikipedia...');
            const wikipediaData = await getWikipediaEvents(date);

            if (wikipediaData.length === 0) {
                return null;
            }

            evenements = wikipediaData
                .sort((a, b) => (b.year || 0) - (a.year || 0))
                .slice(0, 5)
                .sort((a, b) => (a.year || 0) - (b.year || 0));

            setCache(jour, mois, 'events', evenements);
        }

        const topEvenements = evenements
            .slice(0, 5)
            .map(evenement => `**${evenement.year}** : ${evenement.text}`)
            .join('\n\n');

        return { id: 'events', title: 'Événements historiques', content: topEvenements };
    } catch (error) {
        console.error('Erreur dans le module événements historiques:', error);
        return null;
    }
};
