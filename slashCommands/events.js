const { SlashCommandBuilder, Interaction, MessageFlags, PermissionFlagsBits } = require('discord.js');
const db = require('../database_manager.js');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Gère les événements dans la base de données du bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('definir')
                .setDescription('Ajoute un événement.')
                .addIntegerOption(option =>
                    option.setName('jour')
                        .setDescription('Le jour de l\'événement (ex: 15)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('mois')
                        .setDescription('Le mois de l\'événement (ex: 7 pour Juillet)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('annee')
                        .setDescription("L'année de l'événement (optionnel, ex: 2025)")
                        .setRequired(false)
                        .setMinValue(1900)
                        .setMaxValue(2030))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Une brève description de l\'événement')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('voir')
                .setDescription("Affiche les événements enregistrés.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('supprimer')
                .setDescription('Supprime un événement de la base de données.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription("L'ID de l'événement à supprimer (obtenu via la commande 'voir').")
                        .setRequired(true)
                    )
                ),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (subcommand === 'definir') {
            const jour = interaction.options.getInteger('jour');
            const mois = interaction.options.getInteger('mois');
            const annee = interaction.options.getInteger('annee'); // Peut être null
            const description = interaction.options.getString('description');

            // Validation simple de la date
            const testDate = new Date(annee || 2000, mois - 1, jour); // On utilise 2000 comme année bissextile de base si non fournie
            if (testDate.getMonth() !== mois - 1) {
                return interaction.reply({ content: `Cette date n'est pas valide. Le jour ${jour} n'existe pas dans le mois ${mois}.`, flags: MessageFlags.Ephemeral });
            }

            try {
                db.addServerEvent(jour, mois, annee, description);
                const dateString = annee ? `${jour}/${mois}/${annee}` : `${jour}/${mois}`;
                return interaction.reply({ content: `Ton événement a bien été enregistré au ${dateString} !`});
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "Une erreur est survenue lors de l'enregistrement de ton événement.", flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === 'voir') {
            const events = db.getServerEvents();
            if (events.length > 0) {
                let response = "Voici les événements enregistrés :\n";
                for (const event of events) {
                    const dateString = event.annee ? `${event.jour}/${event.mois}/${event.annee}` : `${event.jour}/${event.mois}`;
                    response += ` (${event.id}) - ${dateString} : ${event.description}\n`;
                }
                return interaction.reply({ content: response });
            } else {
                return interaction.reply({ content: "Tu n'as pas encore enregistré d'événements. Utilise `/evenement definir`.", flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === 'supprimer') {
            try {
                const result = db.deleteServerEvent(interaction.options.getInteger('id'));
                if (result.changes > 0) {
                    return interaction.reply({ content: "L'événement a bien été supprimé de la base de données."});
                } else {
                    return interaction.reply({ content: "Aucun événement n'était enregistré avec cet ID.", flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "Une erreur est survenue lors de la suppression de ton événement.", flags: MessageFlags.Ephemeral });
            }
        }
    }
};