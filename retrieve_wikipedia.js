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
            if (error.message === "Keyword field is missing") {
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
function cleanData(data) {
    const seenTexts = new Set();
  
    return data
      .map(entry => {
        const textParts = entry.text.split("\n");
        const cleanedText = textParts.length > 1 ? textParts.slice(1).join("\n").trim() : entry.text;
        return { ...entry, text: cleanedText };
      })
      .filter(entry => {
        if (seenTexts.has(entry.text)) {
          return false;
        }
        seenTexts.add(entry.text);
        return true;
      });
  };

function formatTitle(urlTitle) {
    const decodedTitle = decodeURIComponent(urlTitle);
    
    const formattedTitle = decodedTitle.replace(/_/g, ' ');

    return formattedTitle;
}

function justName(input) {
    const indexes = [input.indexOf(','), input.indexOf('(')]
        .filter(index => index !== -1)
    const firstIndex = Math.min(...indexes)
    return firstIndex !== Infinity ? input.slice(0, firstIndex).trim() : input.trim();
}

async function searchOnThisDay() {
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
            try {
                const url = element.pages[0].content_urls.desktop.page;
                const pageTitle = formatTitle(url.split('/').pop());
                const page = await wiki.page(pageTitle);
                const summary = await page.summary({redirect: false});
                const name = await justName(summary.titles.normalized);

                console.log(name)
                const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 
                
                deaths.push({
                    year: element.year,
                    name,
                    url,
                    description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                    popularity: trending !== null ? trending : 0,
                });
            } catch(err) {
                console.log(err)
            }
        }

        deaths.sort((a, b) => b.popularity - a.popularity);

        let births = [];

        for (const element of events.births) {
            try{
                const url = element.pages[0].content_urls.desktop.page;
                const pageTitle = formatTitle(url.split('/').pop());
                const page = await wiki.page(pageTitle);
                const summary = await page.summary({redirect: false});
                const name = await justName(summary.titles.normalized);

                console.log(name)
                const trending = await retryWithDelay(() => getTrending(name), 5, 20000); 
                
                births.push({
                    year: element.year,
                    name,
                    url,
                    description: summary.description ? `est un(e) ${summary.description}` : 'N\'a pas de description',
                    popularity: trending !== null ? trending : 0,
                });
            }catch(err){
                console.log(err)
            }
        }

        births.sort((a, b) => b.popularity - a.popularity);

        const holidays = events.holidays.slice(0, 4);

        const cleanedHolidays = cleanData(holidays);

        return {
            elementshistoriques: events.selected,
            deaths,
            births,
            holidays: cleanedHolidays
        }
    } catch (error) {
        console.error("Erreur globale :", error);
    }
}


module.exports = { searchOnThisDay }