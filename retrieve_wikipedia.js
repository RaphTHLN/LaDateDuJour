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

async function SearchOnThisDay(){
    try {
        await wiki.setLang("fr");

        const date = new Date();
        const options = { day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
        const options2 = { month: 'numeric' };
        const formattedDate2 = new Intl.DateTimeFormat('fr-FR', options2).format(date);

        const events = await wiki.onThisDay({ month: `${formattedDate2}`, day: `${parseInt(formattedDate) + 1}` });

        let deaths = [];

        for (const element of events.deaths) {
            const name = element.pages[0]?.normalizedtitle;

            if(name && name !== ""){
                const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 

                const page = await wiki.page(name);
                const summary = await page.summary({redirect: false});

                deaths.push({
                    year: element.year,
                    name,
                    description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                    popularity: trending !== null ? trending : 0,
                });
            }
        }

        deaths.sort((a, b) => b.popularity - a.popularity);

        let births = [];

        for (const element of events.births) {
            const name = element.pages[0]?.normalizedtitle;

            if(name && name !== ""){
                const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 

                const page = await wiki.page(name);
                const summary = await page.summary({redirect: false});

                births.push({
                    year: element.year,
                    name,
                    description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                    popularity: trending !== null ? trending : 0,
                });
            }
        }

        births.sort((a, b) => b.popularity - a.popularity);

        const holidays = events.holidays.slice(0, 3);

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