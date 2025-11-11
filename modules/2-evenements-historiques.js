const { callGeminiAPI } = require('../gemini_helper');

module.exports.getSection = async (date, ladatedujour) => {
    const prompt = `Tu es un expert en histoire. Pour la date donnée, fournis 5 événements historiques importants qui se sont produits à cette date (jour et mois) au cours de l'histoire, mais pas nécessairement la même année.

Format de réponse JSON requis:
{
  "evenements": [
    {
      "year": 1234,
      "text": "Description de l'événement"
    }
  ]
}

Les événements doivent être variés (différentes époques) et importants. Trie-les par année croissante.`;

    try {
        const response = await callGeminiAPI(prompt, date);
        const evenements = response.evenements || [];
        
        const topEvenements = evenements
            .slice(0, 5)
            .map(evenement => `**${evenement.year}** : ${evenement.text}`)
            .join('\n\n');

        const events = `### - Événements historiques :  

${topEvenements} `;
        return events;
    } catch (error) {
        console.error('Erreur dans le module événements historiques:', error);
        return '';
    }
}