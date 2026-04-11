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