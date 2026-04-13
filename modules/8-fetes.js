const { getCache, setCache } = require('../cache_manager');

const festivitiesDatabase = {
    "1-1": ["Jour de l'an", "Journée mondiale de la paix"],
    "1-2": ["Journée internationale de la non-violence"],
    "1-3": ["Journée mondiale des zones humides"],
    "1-4": [],
    "1-5": ["Fête du Travail", "Journée internationale des travailleurs"],
    "1-6": ["Jour des Rois", "Épiphanie"],
    "2-1": ["Journée mondiale pour un internet plus sûr"],
    "11-2": ["Fête de la Présentation du Seigneur (Chandeleur)", "Journée internationale des femmes et des filles de science"],
    "14-2": ["Saint-Valentin", "Journée mondiale du don de sang"],
    "21-3": ["Journée mondiale de la trisomie 21", "Journée mondiale de la poésie", "Équinoxe de printemps"],
    "8-3": ["Journée internationale des femmes"],
    "22-3": ["Journée mondiale de l'eau"],
    "2-4": ["Journée mondiale de l'autisme"],
    "22-4": ["Jour de la Terre", "Journée mondiale de la Terre"],
    "5-5": ["Journée mondiale de l'asthme"],
    "8-5": ["Victoire 1945", "Journée mondiale de la Croix-Rouge"],
    "9-5": ["Journée mondiale des espèces menacées d'extinction"],
    "17-5": ["Journée mondiale contre l'homophobie, la transphobie et la biphobie"],
    "22-5": ["Journée mondiale de la biodiversité"],
    "31-5": ["Journée mondiale sans tabac"],
    "5-6": ["Journée mondiale de l'environnement"],
    "8-6": ["Journée mondiale des océans"],
    "19-6": ["Journée mondiale pour l'élimination de la discrimination raciale"],
    "21-6": ["Solstice d'été", "Fête de la Musique"],
    "26-6": ["Journée internationale contre le harcèlement en ligne"],
    "11-7": ["Journée mondiale de la population"],
    "20-7": ["Journée mondiale du jeu vidéo"],
    "28-7": ["Journée mondiale contre l'hépatite"],
    "30-7": ["Journée internationale de l'amitié"],
    "1-8": ["Journée internationale des peuples autochtones"],
    "9-8": ["Journée internationale des populations autochtones"],
    "12-8": ["Journée internationale de la jeunesse"],
    "19-8": ["Journée mondiale de la photographie"],
    "30-8": ["Journée internationale des réfugiés"],
    "21-9": ["Journée internationale de la paix", "Équinoxe d'automne"],
    "27-9": ["Journée mondiale du tourisme"],
    "1-10": ["Journée internationale des personnes âgées"],
    "2-10": ["Journée mondiale de la non-violence"],
    "11-10": ["Journée internationale des filles"],
    "16-10": ["Journée mondiale de l'alimentation"],
    "17-10": ["Journée internationale pour l'élimination de la pauvreté"],
    "24-10": ["Journée des Nations unies"],
    "29-10": ["Journée mondiale de la psoriasis"],
    "31-10": ["Halloween"],
    "1-11": ["Toussaint"],
    "2-11": ["Jour des morts"],
    "19-11": ["Journée mondiale de l'entrepreneur"],
    "20-11": ["Journée mondiale des droits de l'enfant"],
    "25-11": ["Journée internationale pour l'élimination de la violence à l'égard des femmes"],
    "1-12": ["Journée mondiale de lutte contre le sida"],
    "3-12": ["Journée internationale des personnes handicapées"],
    "5-12": ["Journée mondiale du volontariat"],
    "9-12": ["Journée de la laïcité"],
    "10-12": ["Journée mondiale des droits de l'homme"],
    "25-12": ["Noël"],
    "26-12": ["Saint-Étienne", "Kwanzaa"]
};

module.exports.getSection = async (date, ladatedujour) => {
    try {
        const jour = date.getDate();
        const mois = date.getMonth() + 1;
        const dateKey = `${jour}-${mois}`;

        let fetes = getCache(jour, mois, 'celebrations');

        if (!fetes) {
            console.log('Récupération des fêtes depuis la base de données...');

            const festivities = festivitiesDatabase[dateKey] || [];

            fetes = festivities.map(text => ({ text }));

            if (fetes.length > 0) {
                setCache(jour, mois, 'celebrations', fetes);
            }
        }

        if (fetes.length === 0) {
            return '';
        }

        const topFetes = fetes
            .map(fete => `${fete.text}`)
            .join('\n');

        return "### - Fêtes et Journées Internationales :   \n" + topFetes;
    } catch (error) {
        console.error('Erreur dans le module fêtes:', error);
        return '';
    }
};