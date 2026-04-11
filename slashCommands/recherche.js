const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { searchWikipedia } = require('../wikipedia_helper');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('recherche')
        .setDescription('Recherche des informations sur Wikipedia')
        .addStringOption(option =>
            option.setName('sujet')
                .setDescription('Le sujet à rechercher')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher publiquement? (défaut: privé)')
                .setRequired(false)),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        const sujet = interaction.options.getString('sujet');
        const isPublic = interaction.options.getBoolean('public') || false;

        await interaction.deferReply({ flags: isPublic ? 0 : MessageFlags.Ephemeral });

        try {
            console.log(`Recherche Wikipedia pour: ${sujet}`);
            const result = await searchWikipedia(sujet);

            if (!result) {
                return interaction.editReply({
                    content: `❌ Aucun résultat trouvé pour "${sujet}"`
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x3b82f6)
                .setTitle(result.title)
                .setDescription(result.description)
                .addFields(
                    { name: 'Extrait', value: result.extract.substring(0, 500) + (result.extract.length > 500 ? '...' : '') }
                )
                .setURL(result.url)
                .setThumbnail(result.image || null)
                .setFooter({ text: 'Source: Wikipedia' });

            return interaction.editReply({
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: 'Lire sur Wikipedia',
                        style: 5,
                        url: result.url
                    }]
                }]
            });

        } catch (error) {
            console.error('Erreur recherche:', error);
            return interaction.editReply({
                content: '❌ Une erreur est survenue lors de la recherche.'
            });
        }
    }
};

