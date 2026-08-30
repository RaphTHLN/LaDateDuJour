const RETRY_INTERVAL_MS = 10 * 60 * 1000;

function getZonedParts(now, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(now);
    return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

function calendarKey(parts) {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function nextCalendarKey(parts) {
    const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

function dateFromCalendarKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isPreparationWindow(parts) {
    return parts.hour === 23;
}

function isSendWindow(parts) {
    // Toute la première heure sert de fenêtre de rattrapage en cas de démarrage
    // tardif ou de préparation encore active au changement de minute.
    return parts.hour === 0;
}

function shouldRetry(lastCycleAt, now) {
    return !lastCycleAt || now.getTime() - lastCycleAt.getTime() >= RETRY_INTERVAL_MS;
}

function normalizeTimeZone(timeZone) {
    try {
        new Intl.DateTimeFormat('fr-FR', { timeZone }).format();
        return timeZone;
    } catch {
        return 'Europe/Paris';
    }
}

function createDailyScheduler({
    getServers,
    prepare,
    finalize,
    send,
    now = () => new Date(),
    intervalMs = 30000
}) {
    const preparations = new Map();
    const sent = new Set();
    let timer;
    let running = false;

    async function tick() {
        if (running) return;
        running = true;
        try {
            const instant = now();
            const groups = new Map();
            for (const server of getServers()) {
                const timeZone = normalizeTimeZone(server.timezone || 'Europe/Paris');
                const key = `${timeZone}:${calendarKey(getZonedParts(instant, timeZone))}`;
                const group = groups.get(key) || { timeZone, servers: [] };
                group.servers.push(server);
                groups.set(key, group);
            }

            for (const group of groups.values()) {
                const parts = getZonedParts(instant, group.timeZone);
                if (isPreparationWindow(parts)) {
                    const targetKey = nextCalendarKey(parts);
                    const existing = preparations.get(targetKey);
                    if (!existing || (existing.pending.size && shouldRetry(existing.lastCycleAt, instant))) {
                        const result = await prepare(dateFromCalendarKey(targetKey), existing || null);
                        preparations.set(targetKey, result);
                    }
                }

                if (isSendWindow(parts)) {
                    const targetKey = calendarKey(parts);
                    const unsentServers = group.servers.filter(server => !sent.has(`${server.guild_id}:${targetKey}`));
                    if (!unsentServers.length) continue;
                    let preparation = preparations.get(targetKey);
                    if (!preparation) preparation = await prepare(dateFromCalendarKey(targetKey), null, { fallbackAI: true });
                    const sections = await finalize(preparation);
                    preparations.set(targetKey, preparation);
                    for (const server of unsentServers) {
                        const sentKey = `${server.guild_id}:${targetKey}`;
                        try {
                            await send(server, sections, preparation.date);
                            sent.add(sentKey);
                        } catch (error) {
                            console.error(`Erreur lors de l'envoi au serveur ${server.guild_id}:`, error);
                        }
                    }
                }
            }
        } finally {
            running = false;
        }
    }

    return {
        preparations,
        sent,
        tick,
        start() {
            tick().catch(error => console.error('Erreur du planificateur quotidien:', error));
            timer = setInterval(() => tick().catch(error => console.error('Erreur du planificateur quotidien:', error)), intervalMs);
        },
        stop() {
            if (timer) clearInterval(timer);
        }
    };
}

module.exports = {
    RETRY_INTERVAL_MS,
    calendarKey,
    createDailyScheduler,
    dateFromCalendarKey,
    getZonedParts,
    isPreparationWindow,
    isSendWindow,
    nextCalendarKey,
    normalizeTimeZone,
    shouldRetry
};
