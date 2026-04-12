const https = require('https');
const { callGeminiAPI } = require('./gemini_helper');
const { callOllamaAPI, isLocalAIEnabled } = require('./gemma_local_helper');

async function fetchLatestNews() {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        console.warn('⚠️  NEWS_API_KEY non configurée dans .env. Utilisation de données de fallback.');
        return getFallbackNews();
    }

    return new Promise((resolve, reject) => {
        const query = encodeURIComponent('France');
        const sortBy = 'publishedAt';
        const language = 'fr';
        const pageSize = 10;

        const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=${sortBy}&language=${language}&pageSize=${pageSize}&apiKey=${apiKey}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);

                    if (parsed.status !== 'ok') {
                        console.warn('⚠️  Erreur NewsAPI:', parsed.message);
                        resolve(getFallbackNews());
                        return;
                    }

                    const articles = parsed.articles.slice(0, 10).map(article => ({
                        title: article.title || '',
                        description: article.description || '',
                        url: article.url || '',
                        source: article.source.name || 'Source inconnue',
                        publishedAt: article.publishedAt || new Date().toISOString()
                    }));

                    resolve(articles);
                } catch (error) {
                    console.error('Erreur parsing NewsAPI:', error.message);
                    resolve(getFallbackNews());
                }
            });
        }).on('error', (error) => {
            console.error('Erreur requête NewsAPI:', error.message);
            resolve(getFallbackNews());
        });
    });
}

function getFallbackNews() {
    return [
        {
            title: 'Actualité France 1',
            description: 'Une actualité générale sur la France',
            source: 'Fallback',
            url: '#'
        },
        {
            title: 'Actualité France 2',
            description: 'Une autre actualité générale sur la France',
            source: 'Fallback',
            url: '#'
        }
    ];
}
async function summarizeNews(articles) {
    if (!articles || articles.length === 0) {
        return '🗞️ **LES ACTUS DU JOUR**\n\n❌ Aucune actualité disponible pour le moment.';
    }

    const newsText = articles
        .map((article, index) => `${index + 1}. **${article.title}**\n   ${article.description || 'Pas de description'}\n   Source: ${article.source}`)
        .join('\n\n');

    const prompt = `Tu es un expert en synthèse d'actualités.
Lis ces actualités et fais un résumé super court et impactant de 5 points clés MAX.

ACTUALITÉS À RÉSUMER:
${newsText}

INSTRUCTIONS STRICTES:
- Format: "🗞️ **LES ACTUS DU JOUR**" en titre
- Puis 5 points MAXIMUM avec emojis pertinents
- Chaque point: 1 ligne courte et punchy (15-20 mots max)
- Pas de texte inutile, seulement les points clés
- Utilise des emojis au début de chaque point (📰, ⚖️, 🏛️, 💰, etc.)
- Style direct et engageant

RÉPONSE ATTENDUE (en markdown Discord):
🗞️ **LES ACTUS DU JOUR**

📌 Point clé 1
📌 Point clé 2
📌 Point clé 3
[etc]`;

    // 1️⃣ Essayer Gemma4 en priorité
    if (isLocalAIEnabled()) {
        try {
            console.log('🤖 Tentative de synthèse avec Gemma4 (IA locale)...');

            const gemmaPrompt = `${prompt}

Réponds UNIQUEMENT avec le résumé formaté en markdown, sans texte supplémentaire.`;

            const gemmaResponse = await callOllamaAPI(gemmaPrompt, 60000);

            if (gemmaResponse && gemmaResponse.trim().length > 0) {
                console.log('✅ Synthèse Gemma4 réussie');
                return gemmaResponse.trim();
            }
        } catch (error) {
            console.warn('⚠️  Gemma4 indisponible:', error.message);
            console.log('📡 Basculement sur Gemini en secours...');
        }
    }

    // 2️⃣ Fallback : utiliser Gemini
    try {
        console.log('🌐 Synthèse avec Gemini (API cloud)...');

        const jsonPrompt = `Analyse ces actualités et retourne un JSON valide:
${prompt}

Retourne UNIQUEMENT un JSON sans texte supplémentaire:
{
  "summary": "le résumé formaté en markdown"
}`;

        const result = await callGeminiAPI(jsonPrompt, new Date());

        if (result && result.summary) {
            console.log('✅ Synthèse Gemini réussie');
            return result.summary;
        } else {
            return '🗞️ **LES ACTUS DU JOUR**\n\n⚠️ Erreur lors de la génération du résumé.';
        }
    } catch (error) {
        console.error('❌ Erreur Gemini:', error.message);
        return '🗞️ **LES ACTUS DU JOUR**\n\n⚠️ Service temporairement indisponible.';
    }
}

async function getDailyNewsSection() {
    try {
        console.log('📰 Récupération des actualités du jour...');
        const articles = await fetchLatestNews();

        console.log(`✓ ${articles.length} articles récupérés`);

        const summary = await summarizeNews(articles);

        console.log('✓ Résumé généré avec succès');
        return summary;
    } catch (error) {
        console.error('Erreur dans getDailyNewsSection:', error.message);
        return '🗞️ **LES ACTUS DU JOUR**\n\n❌ Impossible de récupérer les actualités pour le moment.';
    }
}

module.exports = {
    fetchLatestNews,
    summarizeNews,
    getDailyNewsSection
};
