/* ********************************************* */
/*                                               */
/*              Partie Google Trend              */
/*             (voir les plus connus)            */
/*                    Terminé                    */
/*                                               */
/* ********************************************* */

const googleTrends = require('google-trends-api-code');

const exclure = [
    "pianiste",
    "chanteur",
    "distillation",
    "position",
    "musicien",
    "baseball",
    "manager",
    "hockey sur glace"
];

async function getTrending(keyword) {
    if (process.env.ISDEV === "1") return 1
    try {
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            throw 'Keyword field is missing';
        }
        
        const lowerKeyword = keyword.toLowerCase();
        if (exclure.includes(lowerKeyword)) return 0;
    
        const today = new Date();
    
        const oneYearEarlier = new Date(today);
        oneYearEarlier.setFullYear(today.getFullYear() - 1);
    
        const query = {
            keyword,
            startTime: oneYearEarlier,
            hl: 'fr',
            geo: 'FR'
        };

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