/* ********************************************* */
/*                                               */
/*                Partie Wikipedia               */
/*                    Terminé                    */
/*                                               */
/* ********************************************* */

const wiki = require('wikipedia');
const { getTrending } = require('./googletrend.js');

async function retryWithDelay(fn, retries, delay) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if(error.message === "Keyword field is missing"){
                return 0;
            }
            console.error(`Tentative ${attempt} échouée :`, error.message);
            if (attempt < retries) {
                console.log(`Réessai dans ${delay} ms...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.log(`Échec après ${retries} tentatives.`);
                return 0;
            }
        }
    }
}

function justName(input) {
    const commaIndex = input.indexOf(',');
    const parenthesisIndex = input.indexOf('(');

    const firstIndex = [commaIndex, parenthesisIndex]
        .filter(index => index !== -1)
        .sort((a, b) => a - b)[0];

    return firstIndex !== undefined ? input.slice(0, firstIndex).trim() : input.trim();
}

async function SearchOnThisDay(){
    try {
        await wiki.setLang("fr");

        const date = new Date();
        date.setDate(date.getDate() + 1);

        const optionsDay = { day: 'numeric' };
        const formattedDay = new Intl.DateTimeFormat('fr-FR', optionsDay).format(date); 
        const optionsMonth = { month: 'numeric' };
        const formattedMonth = new Intl.DateTimeFormat('fr-FR', optionsMonth).format(date);

        const events = await wiki.onThisDay({ month: formattedMonth, day: formattedDay });

        let deaths = [];

        for (const element of events.deaths) {
            const name = await justName(element.text);

            if(name && name !== ""){
                try{
                    const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 

                    const page = await wiki.page(name);
                    const summary = await page.summary({redirect: false});

                    deaths.push({
                        year: element.year,
                        name,
                        description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                        popularity: trending !== null ? trending : 0,
                    });
                }catch(err){}
            }
        }

        deaths.sort((a, b) => b.popularity - a.popularity);

        let births = [];

        for (const element of events.births) {
            const name = await justName(element.text);

            if(name && name !== ""){
                try{
                    const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 

                    const page = await wiki.page(name);
                    const summary = await page.summary({redirect: false});

                    births.push({
                        year: element.year,
                        name,
                        description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                        popularity: trending !== null ? trending : 0,
                    });
                }catch(err){}
            }
        }

        births.sort((a, b) => b.popularity - a.popularity);

        const holidays = events.holidays.slice(0, 4);

        return {
            elementshistoriques: events.selected,
            deaths,
            births,
            holidays
        }
    } catch (error) {
        console.error("Erreur globale :", error);
    }
}

module.exports = { SearchOnThisDay }