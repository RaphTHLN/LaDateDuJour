const test = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');
const {
    AI_FAILURE,
    AIResponseError,
    createScoresSchema,
    parseStructuredResponse,
    runAIAttemptCycle
} = require('../ai_validation');

const silentLogger = { warn() {} };

test('une absence de réponse déclenche exactement deux appels dans un cycle', async () => {
    let calls = 0;
    await assert.rejects(
        runAIAttemptCycle(async () => {
            calls += 1;
            throw new AIResponseError(AI_FAILURE.NO_RESPONSE, 'timeout');
        }, silentLogger),
        error => error.kind === AI_FAILURE.NO_RESPONSE
    );
    assert.equal(calls, 2);
});

test('une réponse incorrecte déclenche exactement trois appels dans un cycle', async () => {
    let calls = 0;
    await assert.rejects(
        runAIAttemptCycle(async () => {
            calls += 1;
            throw new AIResponseError(AI_FAILURE.INVALID_RESPONSE, 'json invalide');
        }, silentLogger),
        error => error.kind === AI_FAILURE.INVALID_RESPONSE
    );
    assert.equal(calls, 3);
});

test('le premier résultat valide est conservé après un échec', async () => {
    let calls = 0;
    const result = await runAIAttemptCycle(async () => {
        calls += 1;
        if (calls === 1) throw new AIResponseError(AI_FAILURE.NO_RESPONSE, 'vide');
        return { summary: 'valide' };
    }, silentLogger);
    assert.deepEqual(result, { summary: 'valide' });
    assert.equal(calls, 2);
});

test('le JSON est extrait puis validé avec Zod', () => {
    const schema = z.object({ summary: z.string().min(1) });
    assert.deepEqual(
        parseStructuredResponse('```json\n{"summary":"Bonjour"}\n```', schema),
        { summary: 'Bonjour' }
    );
    assert.throws(
        () => parseStructuredResponse('{"summary":""}', schema),
        error => error.kind === AI_FAILURE.INVALID_RESPONSE
    );
});

test('le schéma des scores refuse inconnus, doublons et valeurs hors limites', () => {
    const schema = createScoresSchema(['Ada']);
    assert.equal(schema.safeParse({ scores: [{ name: 'Ada', score: 10 }] }).success, true);
    assert.equal(schema.safeParse({ scores: [{ name: 'Grace', score: 8 }] }).success, false);
    assert.equal(schema.safeParse({ scores: [{ name: 'Ada', score: 11 }] }).success, false);
    assert.equal(schema.safeParse({ scores: [{ name: 'Ada', score: 8 }, { name: 'Ada', score: 7 }] }).success, false);
});
