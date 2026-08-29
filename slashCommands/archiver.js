const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { extractComponentText } = require('../daily_renderer');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('archiver')
        .setDescription('Archive le dernier message du calendrier')
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher publiquement? (défaut: privé)')
                .setRequired(false)),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        const isPublic = interaction.options.getBoolean('public') || false;

        await interaction.deferReply({ flags: isPublic ? 0 : MessageFlags.Ephemeral });

        try {
            // Récupérer le dernier message du channel
            const messages = await interaction.channel.messages.fetch({ limit: 10 });

            // Trouver le message qui contient le calendrier (cherche les sections)
            const calendarMsg = messages.find(message => {
                if (message.author.id !== interaction.client.user.id) return false;
                const searchableText = `${message.content || ''}\n${extractComponentText(message.components)}`;
                return searchableText.includes('Nous sommes le') ||
                    searchableText.includes('Événements historiques') ||
                    searchableText.includes('Fêtes et Journées') ||
                    searchableText.includes('Envoyé par');
            });

            if (!calendarMsg) {
                return interaction.editReply({
                    content: '❌ Aucun message de calendrier trouvé récemment.'
                });
            }

            // Créer une archive avec les métadonnées
            const today = new Date();
            const dateStr = today.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const archivedContent = extractComponentText(calendarMsg.components) || calendarMsg.content;
            const embed = new EmbedBuilder()
                .setColor(0x06b6d4)
                .setTitle(`📅 Archive du calendrier`)
                .setDescription(`Archivé le ${dateStr}`)
                .addFields(
                    {
                        name: 'Date du message original',
                        value: `<t:${Math.floor(calendarMsg.createdTimestamp / 1000)}:f>`
                    },
                    {
                        name: 'Auteur',
                        value: `<@${calendarMsg.author.id}>`
                    },
                    {
                        name: 'Contenu',
                        value: archivedContent.substring(0, 1024) + (archivedContent.length > 1024 ? '...' : '')
                    }
                )
                .setFooter({ text: 'Archive créée via /archiver' })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setLabel('Voir le message original')
                .setStyle(ButtonStyle.Link)
                .setURL(calendarMsg.url);

            const row = new ActionRowBuilder().addComponents(button);

            return interaction.editReply({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erreur archivage:', error);
            return interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'archivage.'
            });
        }
    }
};
