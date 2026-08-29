const { z } = require('zod');

const AI_FAILURE = Object.freeze({
    NO_RESPONSE: 'no_response',
    INVALID_RESPONSE: 'invalid_response'
});

class AIResponseError extends Error {
    constructor(kind, message, options = {}) {
        super(message, options);
        this.name = 'AIResponseError';
        this.kind = kind;
    }
}

function extractJson(text) {
    if (typeof text !== 'string' || text.trim() === '') {
        throw new AIResponseError(AI_FAILURE.NO_RESPONSE, "L'IA n'a retourné aucune réponse");
    }

    let value = text.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');
    const match = value.match(/\{[\s\S]*\}/);
    if (match) value = match[0];

    try {
        return JSON.parse(value);
    } catch (error) {
        throw new AIResponseError(
            AI_FAILURE.INVALID_RESPONSE,
            `Réponse JSON invalide: ${error.message}`,
            { cause: error }
        );
    }
}

function parseStructuredResponse(text, schema) {
    const parsed = schema.safeParse(extractJson(text));
    if (!parsed.success) {
        throw new AIResponseError(
            AI_FAILURE.INVALID_RESPONSE,
            `Réponse IA non conforme: ${z.prettifyError(parsed.error)}`,
            { cause: parsed.error }
        );
    }
    return parsed.data;
}

function classifyAIError(error) {
    if (error instanceof AIResponseError) return error;
    return new AIResponseError(
        AI_FAILURE.NO_RESPONSE,
        error?.message || 'Service IA indisponible',
        { cause: error }
    );
}

async function runAIAttemptCycle(operation, logger = console) {
    let noResponseCount = 0;
    let invalidResponseCount = 0;
    let lastError;

    while (noResponseCount < 2 && invalidResponseCount < 3) {
        try {
            return await operation();
        } catch (error) {
            lastError = classifyAIError(error);
            if (lastError.kind === AI_FAILURE.INVALID_RESPONSE) {
                invalidResponseCount += 1;
                logger.warn(`Réponse IA incorrecte (${invalidResponseCount}/3): ${lastError.message}`);
                if (invalidResponseCount >= 3) break;
            } else {
                noResponseCount += 1;
                logger.warn(`Absence de réponse IA (${noResponseCount}/2): ${lastError.message}`);
                if (noResponseCount >= 2) break;
            }
        }
    }

    throw lastError;
}

function createScoresSchema(allowedNames) {
    const names = new Set(allowedNames);
    return z.object({
        scores: z.array(z.object({
            name: z.string().trim().min(1),
            score: z.number().int().min(1).max(10)
        })).min(1)
    }).superRefine(({ scores }, context) => {
        const seen = new Set();
        for (const score of scores) {
            if (!names.has(score.name)) {
                context.addIssue({
                    code: 'custom',
                    path: ['scores'],
                    message: `Personne inconnue: ${score.name}`
                });
            }
            if (seen.has(score.name)) {
                context.addIssue({
                    code: 'custom',
                    path: ['scores'],
                    message: `Personne dupliquée: ${score.name}`
                });
            }
            seen.add(score.name);
        }
    });
}

const newsSummarySchema = z.object({
    summary: z.string().trim().min(1).max(1800)
});

module.exports = {
    AI_FAILURE,
    AIResponseError,
    classifyAIError,
    createScoresSchema,
    extractJson,
    newsSummarySchema,
    parseStructuredResponse,
    runAIAttemptCycle
};
