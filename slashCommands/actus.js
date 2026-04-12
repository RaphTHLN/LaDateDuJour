const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const newsConfig = require('../news_config_manager');
const newsManager = require('../news_manager');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('actus')
        .setDescription('Configure et gère les actualités du jour')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('configurer')
                .setDescription('Configure les paramètres des actualités')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Le canal où publier les actualités')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('heure')
                        .setDescription('L\'heure de publication (0-23)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(23)
                )
                .addIntegerOption(option =>
                    option
                        .setName('minute')
                        .setDescription('Les minutes de publication (0-59)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(59)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('voir')
                .setDescription('Affiche la configuration actuelle des actualités')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('activer')
                .setDescription('Active les actualités pour ce serveur')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('desactiver')
                .setDescription('Désactive les actualités pour ce serveur')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tester')
                .setDescription('Envoie les actualités maintenant (test)')
        ),

    async run(interaction) {
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'configurer') {
                const channel = interaction.options.getChannel('canal');
                const hour = interaction.options.getInteger('heure') ?? 8;
                const minute = interaction.options.getInteger('minute') ?? 0;

                if (!channel.permissionsFor(interaction.client.user).has('SendMessages')) {
                    return interaction.reply({
                        content: '❌ Je n\'ai pas la permission d\'écrire dans ce canal!',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const success = newsConfig.setNewsConfig(guildId, channel.id, hour, minute, true);

                if (success) {
                    return interaction.reply({
                        content: `✅ **Configuration des actualités mise à jour!**\n\n` +
                            `📍 Canal: <#${channel.id}>\n` +
                            `🕐 Heure: \`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}\`\n` +
                            `✓ Actualités: Activées`,
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    return interaction.reply({
                        content: '❌ Erreur lors de la sauvegarde de la configuration',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            if (subcommand === 'voir') {
                const config = newsConfig.getNewsConfig(guildId);

                if (!config) {
                    return interaction.reply({
                        content: '⚠️ Aucune configuration trouvée. Utilisez `/actus configurer` pour en créer une.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const channel = await interaction.client.channels.fetch(config.channel_id).catch(() => null);
                const channelName = channel ? `<#${config.channel_id}>` : `❌ Canal supprimé (${config.channel_id})`;
                const status = config.enabled ? '✅ Activées' : '❌ Désactivées';

                return interaction.reply({
                    content: `📋 **Configuration des actualités du serveur**\n\n` +
                        `📍 Canal: ${channelName}\n` +
                        `🕐 Heure de publication: \`${String(config.post_hour).padStart(2, '0')}:${String(config.post_minute).padStart(2, '0')}\`\n` +
                        `📊 État: ${status}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (subcommand === 'activer') {
                const config = newsConfig.getNewsConfig(guildId);

                if (!config) {
                    return interaction.reply({
                        content: '⚠️ Aucune configuration trouvée. Utilisez `/actus configurer` d\'abord.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                newsConfig.toggleNewsEnabled(guildId, true);

                return interaction.reply({
                    content: '✅ **Actualités activées pour ce serveur!**',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (subcommand === 'desactiver') {
                const config = newsConfig.getNewsConfig(guildId);

                if (!config) {
                    return interaction.reply({
                        content: '⚠️ Aucune configuration trouvée.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                newsConfig.toggleNewsEnabled(guildId, false);

                return interaction.reply({
                    content: '❌ **Actualités désactivées pour ce serveur.**',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (subcommand === 'tester') {
                const config = newsConfig.getNewsConfig(guildId);

                if (!config) {
                    return interaction.reply({
                        content: '⚠️ Aucune configuration trouvée. Utilisez `/actus configurer` d\'abord.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                await interaction.reply({
                    content: '🚀 Génération et envoi des actualités...',
                    flags: MessageFlags.Ephemeral
                });

                try {
                    const channel = await interaction.client.channels.fetch(config.channel_id);
                    const newsContent = await newsManager.getDailyNewsSection();

                    await channel.send(newsContent);

                    await interaction.editReply({
                        content: '✅ **Actualités envoyées avec succès!**'
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'envoi des actualités:', error);
                    await interaction.editReply({
                        content: `❌ **Erreur lors de l'envoi:** ${error.message}`
                    });
                }
            }
        } catch (error) {
            console.error('Erreur commande actus:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
