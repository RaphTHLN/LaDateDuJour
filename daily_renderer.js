const {
    actionRow,
    container,
    mediaGallery,
    separator,
    text,
    v2Message
} = require('@arcscord/components');
const { ButtonBuilder, ButtonStyle } = require('discord.js');

const MAX_TEXT_LENGTH = 4000;
const FINAL_RESERVE = 160;

function getWeatherImageURL(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `https://meteo-express.com/wp-content/uploads/${year}/${month}/${month}-${day}aprem.png`;
}

function sourceRow() {
    return actionRow(
        new ButtonBuilder()
            .setLabel('Tout – Wikipédia')
            .setStyle(ButtonStyle.Link)
            .setURL('https://fr.wikipedia.org/wiki/'),
        new ButtonBuilder()
            .setLabel('Météo – Météo Express')
            .setStyle(ButtonStyle.Link)
            .setURL('https://meteo-express.com/'),
        new ButtonBuilder()
            .setLabel('Anniversaires Animal Crossing – Animal Crossing Wiki')
            .setStyle(ButtonStyle.Link)
            .setURL('https://animalcrossing.fandom.com/wiki/Animal_Crossing_Wiki/')
    );
}

function formatSection(section, roleId) {
    const heading = section.title ? `### ${section.title}\n` : '';
    const mention = section.id === 'header' && roleId ? `||<@&${roleId}>||\n` : '';
    return `${mention}${heading}${section.content}`;
}

function truncate(value, maxLength) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function packSections(sections, roleId) {
    const chunks = [];
    let current = [];
    let currentLength = 0;
    const budget = MAX_TEXT_LENGTH - FINAL_RESERVE;

    for (const section of sections) {
        const formatted = formatSection(section, roleId);
        const safeContent = truncate(formatted, budget);
        if (current.length && currentLength + safeContent.length > budget) {
            chunks.push(current);
            current = [];
            currentLength = 0;
        }
        current.push(safeContent);
        currentLength += safeContent.length;
    }
    if (current.length) chunks.push(current);
    return chunks.length ? chunks : [['Aucune information disponible pour cette date.']];
}

function buildDailyMessages({ sections, date, roleId, botUserId }) {
    const chunks = packSections(sections, roleId);
    return chunks.map((chunk, index) => {
        const isLast = index === chunks.length - 1;
        const children = [];
        chunk.forEach((content, childIndex) => {
            if (childIndex > 0) children.push(separator({ divider: true, spacing: 'large' }));
            children.push(text(content));
        });

        if (isLast) {
            children.push(
                separator({ divider: true, spacing: 'large' }),
                mediaGallery({
                    items: [{
                        media: { url: getWeatherImageURL(date) },
                        description: `Météo du ${date.toLocaleDateString('fr-FR')}`
                    }]
                }),
                text('### Sources'),
                sourceRow(),
                text(`**Envoyé par : <@${botUserId}>**`)
            );
        }

        return v2Message(
            {
                allowedMentions: {
                    parse: ['users'],
                    roles: roleId ? [roleId] : [],
                    repliedUser: false
                }
            },
            ...children
        );
    });
}

function extractComponentText(components) {
    const values = [];
    const visit = component => {
        const data = typeof component?.toJSON === 'function' ? component.toJSON() : component;
        if (!data) return;
        if (typeof data.content === 'string') values.push(data.content);
        if (Array.isArray(data.components)) data.components.forEach(visit);
    };
    (components || []).forEach(visit);
    return values.join('\n\n');
}

module.exports = {
    buildDailyMessages,
    extractComponentText,
    getWeatherImageURL,
    packSections
};
