const http = require('http');
const https = require('https');

function isLocalAIEnabled() {
    return process.env.LOCAL_AI_ENABLED === '1' || process.env.LOCAL_AI_ENABLED === 'true';
}

function getLocalAIConfig() {
    return {
        enabled: isLocalAIEnabled(),
        url: process.env.LOCAL_AI_URL || 'http://localhost:11434',
        model: process.env.LOCAL_AI_MODEL || 'gemma2',
        type: process.env.LOCAL_AI_TYPE || 'ollama'
    };
}

async function callOllamaAPI(prompt, timeoutMs = 30000) {
    const config = getLocalAIConfig();

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: config.model,
            prompt: prompt,
            stream: false,
            temperature: 0.3
        });

        const url = new URL(config.url);
        const isHttps = url.protocol === 'https:';
        const requestModule = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 11434),
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            timeout: timeoutMs
        };

        const req = requestModule.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed.response || '');
                } catch (e) {
                    reject(new Error(`Failed to parse Ollama response: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Ollama request timeout'));
        });

        req.write(data);
        req.end();
    });
}

async function evaluateRelevance(people, eventType = 'birth') {
    if (!isLocalAIEnabled()) {
        // Fallback: score basique basé sur le nombre de mots dans la description
        return people.map(p => ({
            ...p,
            popularite: Math.min(10, Math.max(1, Math.floor((p.description || '').split(' ').length / 5)))
        }));
    }

    try {
        const prompt = `Évalue la pertinence et la popularité de ces ${eventType === 'birth' ? 'naissances' : 'décès'}.
Pour chaque personne, attribue un score de 1-10 (10 = très célèbre/important, 1 = peu connu).

Personnes à évaluer:
${people.map((p, i) => `${i + 1}. ${p.name} (${p.year}): ${p.description}`).join('\n')}

Réponds UNIQUEMENT avec un JSON valide sous cette forme (aucun texte avant ou après):
{
  "scores": [
    {"name": "...", "score": 8},
    {"name": "...", "score": 5}
  ]
}`;

        console.log('Appel à l\'IA locale pour évaluer la pertinence...');
        const response = await callOllamaAPI(prompt);

        // Extraire JSON de la réponse
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const scores = new Map(parsed.scores.map(s => [s.name, s.score]));

        return people.map(p => ({
            ...p,
            popularite: scores.get(p.name) || 5
        }));
    } catch (error) {
        console.warn('Erreur lors de l\'évaluation par l\'IA locale, utilisation du fallback:', error.message);
        // Fallback: score basique
        return people.map(p => ({
            ...p,
            popularite: Math.min(10, Math.max(1, Math.floor((p.description || '').split(' ').length / 5)))
        }));
    }
}

module.exports = {
    isLocalAIEnabled,
    getLocalAIConfig,
    callOllamaAPI,
    evaluateRelevance
};


