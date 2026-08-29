const https = require('https');
const { callGeminiAPI } = require('./gemini_helper');
const { callOllamaAPI, isLocalAIEnabled } = require('./gemma_local_helper');
const { newsSummarySchema, parseStructuredResponse, runAIAttemptCycle } = require('./ai_validation');

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

        const options = {
            headers: {
                'User-Agent': 'LaDateDuJour/2.0.0 (Discord Bot; +https://github.com/RaphTHLN/LaDateDuJour)'
            }
        };

        https.get(url, options, (res) => {
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
function buildFallbackSummary(articles) {
    return articles.slice(0, 5)
        .map(article => `📰 ${article.title}${article.description ? ` — ${article.description}` : ''}`)
        .join('\n');
}

async function summarizeNews(articles, { fallbackAI = false, date = new Date() } = {}) {
    if (!articles || articles.length === 0) {
        return '❌ Aucune actualité disponible pour le moment.';
    }

    if (fallbackAI) return buildFallbackSummary(articles);

    const newsText = articles
        .map((article, index) => `${index + 1}. **${article.title}**\n   ${article.description || 'Pas de description'}\n   Source: ${article.source}`)
        .join('\n\n');

    const prompt = `Tu es un expert en synthèse d'actualités.
Lis ces actualités et fais un résumé super court et impactant de 5 points clés MAX.

ACTUALITÉS À RÉSUMER:
${newsText}

INSTRUCTIONS STRICTES:
- 5 points MAXIMUM avec emojis pertinents
- Chaque point: 1 ligne courte et punchy (15-20 mots max)
- Pas de texte inutile, seulement les points clés
- Utilise des emojis au début de chaque point (📰, ⚖️, 🏛️, 💰, etc.)
- Style direct et engageant

RÉPONSE ATTENDUE: une chaîne Markdown Discord contenant uniquement les points.`;

    // 1️⃣ Essayer Gemma4 en priorité
    if (isLocalAIEnabled()) {
        try {
            console.log('🤖 Tentative de synthèse avec Gemma4 (IA locale)...');

            const gemmaPrompt = `${prompt}\n\nRéponds UNIQUEMENT avec ce JSON: {"summary":"résumé markdown"}`;
            const parsed = await runAIAttemptCycle(async () => {
                const response = await callOllamaAPI(gemmaPrompt, 20000);
                return parseStructuredResponse(response, newsSummarySchema);
            });
            console.log('✅ Synthèse Gemma4 réussie');
            return parsed.summary;
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

        const result = await callGeminiAPI(jsonPrompt, date, newsSummarySchema);
        console.log('✅ Synthèse Gemini réussie');
        return result.summary;
    } catch (error) {
        console.error('❌ Erreur Gemini:', error.message);
        throw error;
    }
}

async function getDailyNewsSection(options = {}) {
    try {
        console.log('📰 Récupération des actualités du jour...');
        const articles = await fetchLatestNews();

        console.log(`✓ ${articles.length} articles récupérés`);

        const summary = await summarizeNews(articles, options);

        console.log('✓ Résumé généré avec succès');
        return summary;
    } catch (error) {
        console.error('Erreur dans getDailyNewsSection:', error.message);
        if (options.fallbackAI) return buildFallbackSummary(getFallbackNews());
        throw error;
    }
}

module.exports = {
    fetchLatestNews,
    buildFallbackSummary,
    summarizeNews,
    getDailyNewsSection
};
