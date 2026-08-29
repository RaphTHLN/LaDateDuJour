const { getWikipediaBirths } = require('../wikipedia_helper');
const { buildPersonSection } = require('../person_section');

module.exports.getSection = (date, options = {}) => {
    return buildPersonSection(date, {
        id: 'births',
        title: 'Anniversaires',
        cacheType: 'births',
        eventType: 'birth',
        fetchPeople: getWikipediaBirths,
        fallbackAI: options.fallbackAI
    });
};
