const test = require('node:test');
const assert = require('node:assert/strict');
const { ComponentType, MessageFlags } = require('discord.js');
const {
    buildDailyMessages,
    extractComponentText
} = require('../daily_renderer');

function build(sections) {
    return buildDailyMessages({
        sections,
        date: new Date(2026, 7, 22, 12),
        roleId: '123456789012345678',
        botUserId: '223456789012345678'
    });
}

test('le rendu utilise Components v2, les séparateurs larges et les boutons sources', () => {
    const [payload] = build([
        { id: 'header', content: '# En-tête' },
        { id: 'events', title: 'Événements', content: 'Contenu' }
    ]);
    assert.ok(payload.flags & MessageFlags.IsComponentsV2);
    const children = payload.components[0].components;
    const separators = children.filter(component => component.type === ComponentType.Separator);
    assert.ok(separators.length >= 2);
    assert.ok(separators.every(component => component.spacing === 2 && component.divider));

    const row = children.find(component => component.type === ComponentType.ActionRow);
    assert.equal(row.components.length, 3);
    assert.ok(row.components.every(button => button.style === 5));
    assert.match(extractComponentText(payload.components), /Événements/);
});

test('les catégories vides sont absentes et un rôle facultatif est supporté', () => {
    const [payload] = buildDailyMessages({
        sections: [{ id: 'header', content: '# En-tête' }],
        date: new Date(2026, 7, 22, 12),
        roleId: null,
        botUserId: '223456789012345678'
    });
    assert.doesNotMatch(extractComponentText(payload.components), /undefined|null/);
    assert.deepEqual(payload.allowedMentions.roles, []);
    assert.deepEqual(payload.allowedMentions.parse, ['users']);
});

test('un message trop long est découpé uniquement entre catégories', () => {
    const payloads = build([
        { id: 'header', content: '# En-tête' },
        { id: 'one', title: 'Un', content: 'a'.repeat(3000) },
        { id: 'two', title: 'Deux', content: 'b'.repeat(3000) }
    ]);
    assert.ok(payloads.length >= 2);
    for (const payload of payloads) {
        const textLength = extractComponentText(payload.components).length;
        assert.ok(textLength <= 4000);
    }
});
