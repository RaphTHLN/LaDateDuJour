const { SlashCommandBuilder, Interaction, MessageFlags } = require('discord.js');
const db = require('../database_manager.js');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('anniversaire')
        .setDescription('Gère ton anniversaire dans la base de données du bot.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('definir')
                .setDescription('Ajoute ou modifie ton anniversaire.')
                .addIntegerOption(option =>
                    option.setName('jour')
                        .setDescription('Le jour de ta naissance (ex: 15)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('mois')
                        .setDescription('Le mois de ta naissance (ex: 7 pour Juillet)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('annee')
                        .setDescription("Ton année de naissance (optionnel, ex: 2005)")
                        .setRequired(false)
                        .setMinValue(1900)
                        .setMaxValue(new Date().getFullYear())))
        .addSubcommand(subcommand =>
            subcommand
                .setName('voir')
                .setDescription("Affiche ton anniversaire enregistré."))
        .addSubcommand(subcommand =>
            subcommand
                .setName('supprimer')
                .setDescription('Supprime ton anniversaire de la base de données.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('chercher')
                .setDescription('Interroge la base de données pour trouver un anniversaire en fonction du jour ou du mois.')
                .addIntegerOption(option =>
                    option.setName('jour')
                        .setDescription('Le jour à rechercher (ex: 15)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('mois')
                        .setDescription('Le mois à rechercher (ex: 7 pour Juillet)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(12))
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

            // Validation simple de la date
            const testDate = new Date(annee || 2000, mois - 1, jour); // On utilise 2000 comme année bissextile de base si non fournie
            if (testDate.getMonth() !== mois - 1) {
                return interaction.reply({ content: `Cette date n'est pas valide. Le jour ${jour} n'existe pas dans le mois ${mois}.`, flags: MessageFlags.Ephemeral });
            }

            try {
                db.addOrUpdateBirthday(userId, jour, mois, annee);
                const dateString = annee ? `${jour}/${mois}/${annee}` : `${jour}/${mois}`;
                return interaction.reply({ content: `Ton anniversaire a bien été enregistré au ${dateString} !`});
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "Une erreur est survenue lors de l'enregistrement de ton anniversaire.", flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === 'voir') {
            const birthday = db.getBirthdayForUser(userId);
            if (birthday) {
                const dateString = birthday.annee ? `${birthday.jour}/${birthday.mois}/${birthday.annee}` : `${birthday.jour}/${birthday.mois}`;
                return interaction.reply({ content: `Ton anniversaire est enregistré au : ${dateString}.` });
            } else {
                return interaction.reply({ content: "Tu n'as pas encore enregistré ton anniversaire. Utilise `/anniversaire definir`.", flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === 'supprimer') {
            try {
                const result = db.deleteBirthday(userId);
                if (result.changes > 0) {
                    return interaction.reply({ content: "Ton anniversaire a bien été supprimé de la base de données."});
                } else {
                    return interaction.reply({ content: "Aucun anniversaire n'était enregistré pour toi.", flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "Une erreur est survenue lors de la suppression de ton anniversaire.", flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === 'chercher') {
            const jour = interaction.options.getInteger('jour');
            const mois = interaction.options.getInteger('mois');

          /*  if (!jour && !mois) {
                return interaction.reply({ content: "Tu dois fournir au moins un des deux paramètres : jour ou mois.", flags: MessageFlags.Ephemeral });
            }*/

            try {
                const results = db.getBirthday(jour, mois);
                if (results.length === 0) {
                    return interaction.reply({ content: "Aucun anniversaire trouvé pour les critères fournis.", flags: MessageFlags.Ephemeral });
                }

                let response = `J'ai trouvé ${results.length} anniversaire(s) correspondant à ta recherche :\n`;
                for (const entry of results) {
                    const dateString = entry.annee ? `le ${entry.jour}/${entry.mois}/${entry.annee}` : `le ${entry.jour}/${entry.mois}`;
                    response += `- <@${entry.user_id}> : ${dateString}\n`;
                }

                return interaction.reply({ content: response, allowedMentions: {parse: [] } });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "Une erreur est survenue lors de la recherche des anniversaires.", flags: MessageFlags.Ephemeral });
            }
        }
    }
};