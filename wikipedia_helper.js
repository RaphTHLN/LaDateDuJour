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

async function getWikipediaEvents(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const url = `https://fr.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;

    try {
        const data = await makeWikipediaRequest(url);
        return (data.events || []).map(event => ({
            year: event.year,
            text: event.text.replace(/\[\[/g, '').replace(/]]/g, ''),
            url: event.pages?.[0]?.content_urls?.desktop?.page || '#'
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des événements Wikipedia:', error.message);
        return [];
    }
}

async function getWikipediaBirths(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const url = `https://fr.wikipedia.org/api/rest_v1/feed/onthisday/births/${month}/${day}`;

    try {
        const data = await makeWikipediaRequest(url);
        return (data.births || []).map(birth => ({
            year: birth.year,
            name: birth.text.replace(/\[\[/g, '').replace(/]]/g, '').split(',')[0].trim(),
            description: birth.text.replace(/\[\[/g, '').replace(/]]/g, ''),
            url: birth.pages?.[0]?.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${birth.pages?.[0]?.title || ''}`,
            titleUrl: birth.pages?.[0]?.title || ''
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des naissances Wikipedia:', error.message);
        return [];
    }
}

async function getWikipediaDeaths(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const url = `https://fr.wikipedia.org/api/rest_v1/feed/onthisday/deaths/${month}/${day}`;
    
    try {
        const data = await makeWikipediaRequest(url);
        return (data.deaths || []).map(death => ({
            year: death.year,
            name: death.text.replace(/\[\[/g, '').replace(/]]/g, '').split(',')[0].trim(),
            description: death.text.replace(/\[\[/g, '').replace(/]]/g, ''),
            url: death.pages?.[0]?.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${death.pages?.[0]?.title || ''}`,
            titleUrl: death.pages?.[0]?.title || ''
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des décès Wikipedia:', error.message);
        return [];
    }
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

