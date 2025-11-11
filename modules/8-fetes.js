const { callGeminiAPI } = require('../gemini_helper');

module.exports.getSection = async (date, ladatedujour) => {
    const prompt = `Tu es un expert en culture et traditions. Pour la date donnée, fournis les fêtes, journées internationales, commémorations et célébrations qui sont associées à cette date (jour et mois).

Format de réponse JSON requis:
{
  "fetes": [
    {
      "text": "Nom de la fête ou journée internationale"
    }
  ]
}

Inclus les fêtes religieuses, journées internationales officielles, commémorations nationales, et autres célébrations importantes.`;

    try {
        const response = await callGeminiAPI(prompt, date);
        const fetes = response.fetes || [];
        
        const topFetes = fetes
            .map(fete => `${fete.text}`)
            .join('\n\n');

        return "### - Fêtes et Journées Internationales :   \n" + topFetes;
    } catch (error) {
        console.error('Erreur dans le module fêtes:', error);
        return '';
    }
};