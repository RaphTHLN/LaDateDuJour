const https = require('https');

function makeWikipediaRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'LaDateDuJour-Bot/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse Wikipedia response'));
                }
            });
        }).on('error', reject);
    });
}

async function getOnThisDay(date, type) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const url = `https://fr.wikipedia.org/api/rest_v1/feed/onthisday/${type}/${month}/${day}`;

    try {
        const data = await makeWikipediaRequest(url);
        return data[type] || [];
    } catch (error) {
        console.error(`Erreur lors de la récupération Wikipedia (${type}):`, error.message);
        return [];
    }
}

function cleanWikipediaText(value = '') {
    return value.replace(/\[\[/g, '').replace(/]]/g, '');
}

function mapPerson(person) {
    const description = cleanWikipediaText(person.text);
    const page = person.pages?.[0];
    return {
        year: person.year,
        name: description.split(',')[0].trim(),
        description,
        url: page?.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${page?.title || ''}`,
        titleUrl: page?.title || ''
    };
}

async function getWikipediaEvents(date) {
    return (await getOnThisDay(date, 'events')).map(event => ({
        year: event.year,
        text: cleanWikipediaText(event.text),
        url: event.pages?.[0]?.content_urls?.desktop?.page || '#'
    }));
}

async function getWikipediaBirths(date) {
    return (await getOnThisDay(date, 'births')).map(mapPerson);
}

async function getWikipediaDeaths(date) {
    return (await getOnThisDay(date, 'deaths')).map(mapPerson);
}

async function searchWikipedia(query) {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    try {
        const data = await makeWikipediaRequest(url);
        return {
            title: data.title,
            description: data.description || '',
            extract: data.extract || '',
            url: data.content_urls?.desktop?.page || '',
            image: data.thumbnail?.source || ''
        };
    } catch (error) {
        console.error('Erreur lors de la recherche Wikipedia:', error.message);
        return null;
    }
}

module.exports = {
    getWikipediaEvents,
    getWikipediaBirths,
    getWikipediaDeaths,
    searchWikipedia
};
