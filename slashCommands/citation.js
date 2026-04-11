const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

// Base de données de citations inspirantes
const quotes = [
    {
        text: "La vraie sagesse est de connaître l'étendue de son ignorance.",
        author: "Socrate"
    },
    {
        text: "Le futur appartient à ceux qui croient en la beauté de leurs rêves.",
        author: "Eleanor Roosevelt"
    },
    {
        text: "La seule façon de faire du grand travail est d'aimer ce que vous faites.",
        author: "Steve Jobs"
    },
    {
        text: "The design is how it works.",
        author: "Steve Jobs"
    },
    {
        text: "Le code est la poésie écrite en machine.",
        author: "Unknown"
    },
    {
        text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.",
        author: "Proverbe chinois"
    },
    {
        text: "On ne peut pas aider quelqu'un si on ne l'écoute pas.",
        author: "Robert Nozick"
    },
    {
        text: "Le secret de l'avancement est de commencer.",
        author: "Mark Twain"
    },
    {
        text: "La persévérance n'est pas une course longue. C'est beaucoup de petites courses les unes après les autres.",
        author: "Walter Elliot"
    },
    {
        text: "Le succès n'est pas final, l'échec n'est pas fatal : seul le courage de continuer compte.",
        author: "Winston Churchill"
    },
    {
        text: "Dans une minute, il y a 60 secondes. Utilisez-les.",
        author: "Benjamin Franklin"
    },
    {
        text: "Vous ne pouvez pas construire une réputation sur ce que vous allez faire.",
        author: "Henry Ford"
    }
];

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('citation')
        .setDescription('Affiche une citation inspirante du jour')
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher publiquement? (défaut: privé)')
                .setRequired(false)),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        const isPublic = interaction.options.getBoolean('public') || false;

        // Sélectionner une citation basée sur la date du jour
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const quoteIndex = dayOfYear % quotes.length;
        const quote = quotes[quoteIndex];

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('💭 Citation du jour')
            .setDescription(`*"${quote.text}"*`)
            .addFields(
                { name: 'Auteur', value: `— ${quote.author}` }
            )
            .setFooter({ text: `Conseil du jour ${dayOfYear}` });

        return interaction.reply({
            embeds: [embed],
            flags: isPublic ? 0 : MessageFlags.Ephemeral
        });
    }
};

