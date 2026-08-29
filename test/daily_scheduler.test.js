const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createDailyScheduler,
    getZonedParts,
    nextCalendarKey,
    normalizeTimeZone
} = require('../daily_scheduler');

test('les dates locales suivent le fuseau et le passage au lendemain', () => {
    const instant = new Date('2026-08-21T21:00:00.000Z');
    const paris = getZonedParts(instant, 'Europe/Paris');
    const newYork = getZonedParts(instant, 'America/New_York');
    assert.equal(paris.hour, 23);
    assert.equal(newYork.hour, 17);
    assert.equal(nextCalendarKey(paris), '2026-08-22');
    assert.equal(normalizeTimeZone('Fuseau/Invalide'), 'Europe/Paris');
});

test('la préparation est relancée après dix minutes puis finalisée à minuit', async () => {
    let current = new Date('2026-08-21T21:00:00.000Z');
    let prepareCalls = 0;
    let finalizeCalls = 0;
    let sendCalls = 0;
    const scheduler = createDailyScheduler({
        getServers: () => [{ guild_id: '1', channel_id: '2', timezone: 'Europe/Paris' }],
        now: () => current,
        prepare: async (date, existing) => {
            prepareCalls += 1;
            const state = existing || { date, pending: new Set(['news']) };
            state.lastCycleAt = new Date(current);
            return state;
        },
        finalize: async state => {
            finalizeCalls += 1;
            state.pending.clear();
            return [{ id: 'header', content: '# Test' }];
        },
        send: async () => { sendCalls += 1; }
    });

    await scheduler.tick();
    assert.equal(prepareCalls, 1);
    current = new Date('2026-08-21T21:05:00.000Z');
    await scheduler.tick();
    assert.equal(prepareCalls, 1);
    current = new Date('2026-08-21T21:10:00.000Z');
    await scheduler.tick();
    assert.equal(prepareCalls, 2);
    current = new Date('2026-08-21T22:00:00.000Z');
    await scheduler.tick();
    assert.equal(finalizeCalls, 1);
    assert.equal(sendCalls, 1);
    await scheduler.tick();
    assert.equal(sendCalls, 1, 'un serveur ne reçoit pas deux fois la même date');
    current = new Date('2026-08-21T22:30:00.000Z');
    await scheduler.tick();
    assert.equal(sendCalls, 1, 'la fenêtre de rattrapage ne crée pas de doublon');
});

test('le calendrier reste correct au changement d’heure saisonnière', () => {
    const beforeWinterChange = getZonedParts(new Date('2026-10-24T21:00:00.000Z'), 'Europe/Paris');
    const afterWinterChange = getZonedParts(new Date('2026-10-25T23:00:00.000Z'), 'Europe/Paris');
    assert.equal(beforeWinterChange.hour, 23);
    assert.equal(nextCalendarKey(beforeWinterChange), '2026-10-25');
    assert.equal(afterWinterChange.hour, 0);
    assert.equal(afterWinterChange.day, 26);
});

test('deux fuseaux peuvent préparer des dates différentes au même instant', async () => {
    const dates = [];
    const scheduler = createDailyScheduler({
        getServers: () => [
            { guild_id: 'paris', timezone: 'Europe/Paris' },
            { guild_id: 'utc', timezone: 'UTC' }
        ],
        now: () => new Date('2026-12-31T23:00:00.000Z'),
        prepare: async date => {
            dates.push(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
            return { date, pending: new Set(), lastCycleAt: new Date() };
        },
        finalize: async () => [],
        send: async () => {}
    });
    await scheduler.tick();
    assert.ok(dates.includes('2027-1-1'));
});

test('un démarrage après minuit prépare directement avec les fallbacks', async () => {
    let receivedOptions;
    let sends = 0;
    const scheduler = createDailyScheduler({
        getServers: () => [{ guild_id: 'utc', timezone: 'UTC' }],
        now: () => new Date('2026-08-22T00:30:00.000Z'),
        prepare: async (date, existing, options) => {
            receivedOptions = options;
            return { date, pending: new Set(), sections: new Map(), lastCycleAt: new Date() };
        },
        finalize: async () => [],
        send: async () => { sends += 1; }
    });
    await scheduler.tick();
    assert.deepEqual(receivedOptions, { fallbackAI: true });
    assert.equal(sends, 1);
});
