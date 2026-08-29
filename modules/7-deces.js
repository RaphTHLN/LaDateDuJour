const { getWikipediaDeaths } = require('../wikipedia_helper');
const { buildPersonSection } = require('../person_section');

module.exports.getSection = (date, options = {}) => {
    return buildPersonSection(date, {
        id: 'deaths',
        title: 'Décès',
        cacheType: 'deaths',
        eventType: 'death',
        fetchPeople: getWikipediaDeaths,
        fallbackAI: options.fallbackAI
    });
};
