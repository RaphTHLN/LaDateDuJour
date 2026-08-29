const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseStructuredResponse, runAIAttemptCycle } = require('./ai_validation');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function callGeminiAPI(prompt, date, schema) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    
    const fullPrompt = `${prompt}\n\nDate: ${dateStr}\n\nImportant: Réponds UNIQUEMENT avec un JSON valide, sans texte supplémentaire avant ou après.`;
    
    return runAIAttemptCycle(async () => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 20000;
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Timeout Gemini après ${timeoutMs} ms`)), timeoutMs);
        });
        try {
            const result = await Promise.race([model.generateContent(fullPrompt), timeout]);
            const response = await result.response;
            return parseStructuredResponse(response.text(), schema);
        } finally {
            clearTimeout(timeoutId);
        }
    });
}

module.exports = {
    callGeminiAPI
};
