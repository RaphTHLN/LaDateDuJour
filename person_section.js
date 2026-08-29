const { getCache, setCache } = require('./cache_manager');
const { evaluateRelevance, applyRelevanceFallback } = require('./gemma_local_helper');

function selectTopPeople(people, limit = 3) {
    return [...people]
        .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
        .slice(0, limit)
        .sort((a, b) => (a.year || 0) - (b.year || 0));
}

async function buildPersonSection(date, options) {
    const {
        id,
        title,
        cacheType,
        eventType,
        fetchPeople,
        fallbackAI = false
    } = options;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    let people = getCache(day, month, cacheType);

    if (!people) {
        const source = await fetchPeople(date);
        if (!source.length) return null;

        people = fallbackAI
            ? applyRelevanceFallback(source)
            : await evaluateRelevance(source, eventType);

        // Le cache ne reçoit que des données déterministes ou validées par Zod.
        setCache(day, month, cacheType, people);
    }

    const content = selectTopPeople(people)
        .map(person => `**${person.year}** : [${person.name}](<${person.url}>) ${person.description}`)
        .join('\n\n');

    return content ? { id, title, content } : null;
}

module.exports = {
    buildPersonSection,
    selectTopPeople
};
