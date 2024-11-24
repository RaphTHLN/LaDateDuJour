/* ********************************************* */
/*                                               */
/*              Partie Google Trend              */
/*             (voir les plus connus)            */
/*                    Terminé                    */
/*          Mais on va peut-être changer         */
/*             ( problème de quota )             */
/*                                               */
/* ********************************************* */

const googleTrends = require('google-trends-api-code');

async function getTrending(keyword) {
    const today = new Date();

    const oneYearEarlier = new Date(today);
    oneYearEarlier.setFullYear(today.getFullYear() - 1);

    const query = {
        keyword,
        startTime: oneYearEarlier,
        hl: 'fr',
        geo: 'FR'
    };

    try {
        const results = await googleTrends.interestOverTime(query);
        const data = JSON.parse(results);

        const total = data.default.timelineData.reduce((acc, element) => {
            return acc + (element.value[0] || 0);
        }, 0);

        return total;
    } catch (err) {
        console.error('Oh non, il y a eu une erreur :', err);
        throw err;
    }
}

module.exports = { getTrending };