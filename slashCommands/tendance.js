const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

// Simule des tendances (vous pouvez intégrer une vraie API si nécessaire)
function getTrendingTopics() {
    const topics = [
        { name: 'Intelligence Artificielle', emoji: '🤖', trend: 'up' },
        { name: 'Changement climatique', emoji: '🌍', trend: 'stable' },
        { name: 'Technologie', emoji: '💻', trend: 'up' },
        { name: 'Santé', emoji: '🏥', trend: 'stable' },
        { name: 'Sport', emoji: '⚽', trend: 'up' },
        { name: 'Science', emoji: '🔬', trend: 'up' },
        { name: 'Culture', emoji: '🎨', trend: 'stable' },
        { name: 'Économie', emoji: '📈', trend: 'down' },
    ];

    // Sélectionner 4 aléatoires
    return topics.sort(() => 0.5 - Math.random()).slice(0, 4);
}

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('tendance')
        .setDescription('Affiche les tendances et actualités du moment')
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher publiquement? (défaut: privé)')
                .setRequired(false)),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        const isPublic = interaction.options.getBoolean('public') || false;

        const trending = getTrendingTopics();

        const embed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('📊 Tendances du moment')
            .setDescription('Les sujets les plus en vogue du jour')
            .addFields(
                trending.map(topic => ({
                    name: `${topic.emoji} ${topic.name}`,
                    value: `Tendance: ${topic.trend === 'up' ? '📈 En hausse' : topic.trend === 'down' ? '📉 En baisse' : '➡️ Stable'}`,
                    inline: true
                }))
            )
            .setFooter({ text: 'Source: Tendances globales' })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            flags: isPublic ? 0 : MessageFlags.Ephemeral
        });
    }
};

