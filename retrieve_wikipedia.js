/* ********************************************* */
/*                                               */
/*                Partie Wikipedia               */
/*                 Quasi terminé                 */
/*                                               */
/* ********************************************* */

const wiki = require('wikipedia');
const { getTrending } = require('./googletrend.js');

async function retryWithDelay(fn, retries, delay) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
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

(async () => {
    try {
        await wiki.setLang("fr");

        const events = await wiki.onThisDay();

        console.log("Événements Historiques :\n")
        for (const element of events.selected) {
            console.log(`${element.year} : ${element.text}`);
        }

        console.log("\n\nMorts :\n");
        let deaths = [];

        for (const element of events.deaths) {
            const name = element.pages[0]?.normalizedtitle;

            const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 

            const page = await wiki.page(name);
            const summary = await page.summary({redirect: false});

            deaths.push({
                year: element.year,
                name,
                description: `est un(e) ${summary.description}`,
                popularity: trending !== null ? trending : 0,
            });
        }

        deaths.sort((a, b) => b.popularity - a.popularity);

        deaths.forEach(death => {
            console.log(
                `Année : ${death.year}, Nom : ${death.name}, Description: ${death.description}, Popularité : ${death.popularity}`
            );
        });

        console.log('\n\nNaissances :\n');
        let births = [];

        for (const element of events.births) {
            const name = element.pages[0]?.normalizedtitle;

            const trending = await retryWithDelay(() => getTrending(name), 5, 20000);

            const page = await wiki.page(name);
            const summary = await page.summary({redirect: false});

            births.push({
                year: element.year,
                name,
                description: `est un(e) ${summary.description}`,
                popularity: trending !== null ? trending : 0,
            });
        }

        births.sort((a, b) => b.popularity - a.popularity);

        births.forEach(birth => {
            console.log(
                `Année : ${birth.year}, Nom : ${birth.name}, Description: ${birth.description}, Popularité : ${birth.popularity}`
            );
        });

        console.log('\n\nFêtes :\n');
        const holidays = events.holidays.slice(0, 4);
        for (const element of holidays) {
            console.log(element.text);
        }
    } catch (error) {
        console.error("Erreur globale :", error);
    }
})();