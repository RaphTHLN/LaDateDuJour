/**
 * Trie un tableau de données, prend les 3 entrées les plus populaires, 
 * puis les retrie les par année croissante.
 * @param {Array} data - Le tableau à traiter. Doit contenir des objets avec les propriétés 'popularite' et 'annee'.
 * @returns {Array} Le tableau trié et filtré.
 */
function getTop3(data) {
    if (!data || !Array.isArray(data)) return [];

    return data
        .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
        .slice(0, 3)
        .sort((a, b) => (a.annee || 0) - (b.annee || 0));
}

async function checkBirthdays() {

    const birthdayfile = JSON.parse(fs.readFileSync(birthdaynamefile, 'utf8'));
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    let results = [];

    birthdayfile.forEach(user => {
        if (user.jour === todayDay && user.mois === todayMonth) {
            let age = null;
            if (user.annee) {
                age = user.annee
            }
            results.push({
                identifiant: user.identifiant,
                age: age,
                genre: user.genre
            });
        }
    });

    if (results.length > 0) {
        return results;
    } else {
        return null;
    }
}; 

module.exports = {
    getTop3,
    checkBirthdays
};