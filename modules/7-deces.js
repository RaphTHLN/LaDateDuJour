const { callGeminiAPI } = require('../gemini_helper');

module.exports.getSection = async (date, ladatedujour) => {
    const prompt = `Tu es un expert en histoire et culture. Pour la date donnée, fournis 3 personnalités célèbres (personnes connues et importantes) qui sont décédées à cette date (jour et mois) au cours de l'histoire.

Format de réponse JSON requis:
{
  "deces": [
    {
      "year": 1950,
      "name": "Nom de la personnalité",
      "url": "https://fr.wikipedia.org/wiki/Nom_de_la_personnalité",
      "description": "Brève description de la personnalité (profession, nationalité, pourquoi elle est connue)",
      "popularite": 10
    }
  ]
}

Les personnalités doivent être variées et vraiment célèbres. Le champ "popularite" doit être un nombre entre 1 et 10 indiquant l'importance de la personnalité. Trie les résultats par popularité décroissante, puis par année croissante.`;

    try {
        const response = await callGeminiAPI(prompt, date);
        const deces = response.deces || [];
        
        // Trier par popularité décroissante, prendre les 3 premiers, puis trier par année croissante
        const topMorts = deces
            .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
            .slice(0, 3)
            .sort((a, b) => (a.year || 0) - (b.year || 0))
            .map(mort => `**${mort.year}** : [${mort.name}](<${mort.url}>) ${mort.description}`)
            .join('\n\n');

        return "### - Décès : \n" + topMorts;
    } catch (error) {
        console.error('Erreur dans le module décès:', error);
        return '';
    }
};