const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Fonction helper pour attendre un certain temps
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Appelle l'API Gemini avec un prompt et retourne la réponse JSON parsée
 * Inclut un système de retry avec backoff exponentiel pour gérer les erreurs 503
 * @param {string} prompt - Le prompt à envoyer à Gemini
 * @param {Date} date - La date pour laquelle récupérer les informations
 * @param {number} maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @returns {Promise<Object>} Les données JSON parsées depuis la réponse de Gemini
 */
async function callGeminiAPI(prompt, date, maxRetries = 2) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const fallbackModel = modelName === 'gemini-2.5-flash' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    
    const fullPrompt = `${prompt}\n\nDate: ${dateStr}\n\nImportant: Réponds UNIQUEMENT avec un JSON valide, sans texte supplémentaire avant ou après.`;
    
    let lastError = null;
    
    const modelsToTry = [modelName, fallbackModel];
    
    for (const currentModel of modelsToTry) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: currentModel });
                
                if (attempt > 0) {
                    // Backoff exponentiel : 2s, 4s, 8s...
                    const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
                    console.log(`Tentative ${attempt + 1}/${maxRetries} avec le modèle ${currentModel} après ${delay}ms...`);
                    await sleep(delay);
                }
                
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();
                
                let jsonText = text.trim();
                
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
                } else if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonText = jsonMatch[0];
                }
                
                try {
                    const parsed = JSON.parse(jsonText);
                    return parsed;
                } catch (parseError) {
                    console.error('Erreur de parsing JSON. Réponse brute:', jsonText.substring(0, 500));
                    throw new Error(`Impossible de parser la réponse JSON de Gemini: ${parseError.message}`);
                }
            } catch (error) {
                lastError = error;
                
                // Si c'est une erreur 503 (service surchargé) ou 429 (rate limit), on réessaie
                const isRetryable = error.status === 503 || error.status === 429 || 
                                   (error.message && (error.message.includes('overloaded') || error.message.includes('rate limit')));
                
                if (isRetryable && attempt < maxRetries - 1) {
                    console.warn(`Erreur ${error.status || 'inconnue'} avec ${currentModel}, nouvelle tentative...`);
                    continue;
                } else if (!isRetryable) {
                    // Erreur non récupérable, on passe au modèle suivant ou on échoue
                    break;
                }
            }
        }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    console.error('Erreur lors de l\'appel à l\'API Gemini après toutes les tentatives:', lastError);
    throw lastError || new Error('Échec de l\'appel à l\'API Gemini');
}

module.exports = {
    callGeminiAPI
};

