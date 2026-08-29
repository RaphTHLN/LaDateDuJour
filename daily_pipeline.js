const fs = require('fs');
const path = require('path');
const { AIResponseError } = require('./ai_validation');

const modulesDir = path.join(__dirname, 'modules');
const moduleFiles = fs.readdirSync(modulesDir)
    .filter(file => /^\d+-.*\.js$/.test(file))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
const aiModuleFiles = new Set(['4-naissances.js', '7-deces.js', '9-actus.js']);

function createPreparation(date) {
    return {
        date,
        sections: new Map(),
        pending: new Set(),
        lastCycleAt: null
    };
}

async function runModule(preparation, file, options = {}) {
    try {
        const dailyModule = require(path.join(modulesDir, file));
        const section = await dailyModule.getSection(preparation.date, options);
        preparation.sections.set(file, section || null);
        preparation.pending.delete(file);
        console.log(`${file} ${section ? '✓' : '○'}`);
    } catch (error) {
        if (aiModuleFiles.has(file) || error instanceof AIResponseError) {
            preparation.pending.add(file);
            console.warn(`${file} en attente d'une nouvelle tentative IA: ${error.message}`);
            return;
        }
        preparation.sections.set(file, null);
        console.error(`Erreur sur le module ${file}:`, error);
    }
}

async function prepareDailyContent(date, existing = null, options = {}) {
    const preparation = existing || createPreparation(date);
    const files = existing ? [...preparation.pending] : moduleFiles;
    for (const file of files) {
        await runModule(preparation, file, options);
    }
    preparation.lastCycleAt = new Date();
    return preparation;
}

async function finalizeDailyContent(preparation) {
    if (preparation.finalizedSections) return preparation.finalizedSections;
    for (const file of [...preparation.pending]) {
        await runModule(preparation, file, { fallbackAI: true });
    }
    preparation.pending.clear();
    preparation.finalizedSections = getPreparedSections(preparation);
    return preparation.finalizedSections;
}

function getPreparedSections(preparation) {
    return moduleFiles
        .map(file => preparation.sections.get(file))
        .filter(Boolean);
}

module.exports = {
    createPreparation,
    finalizeDailyContent,
    getPreparedSections,
    prepareDailyContent
};
