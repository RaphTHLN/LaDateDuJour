const { SlashCommandBuilder, MessageFlags, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const configManager = require('../config_manager');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('configurer')
        .setDescription('Configure le bot pour ce serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('canal')
                .setDescription('Définir le canal où envoyer les messages quotidiens')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Le canal de destination')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Définir le rôle à mentionner (optionnel)')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à mentionner')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('voir')
                .setDescription('Affiche la configuration actuelle'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('activer')
                .setDescription('Active les envois pour ce serveur'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('desactiver')
                .setDescription('Désactive les envois pour ce serveur')),

    /**
     * @param {Interaction} interaction
     */
    async run(interaction) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'canal') {
            const channel = interaction.options.getChannel('canal');

            try {
                configManager.addOrUpdateServer(guildId, channel.id);

                const embed = new EmbedBuilder()
                    .setColor(0x10b981)
                    .setTitle('✅ Configuration mise à jour')
                    .setDescription(`Canal de destination: <#${channel.id}>`)
                    .setFooter({ text: 'Configuration sauvegardée' });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Erreur config:', error);
                return interaction.reply({
                    content: '❌ Une erreur est survenue lors de la configuration.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (subcommand === 'role') {
            const role = interaction.options.getRole('role');
            const server = configManager.getServer(guildId);

            if (!server) {
                return interaction.reply({
                    content: '❌ Aucun canal n\'est configuré. Utilisez `/configurer canal` d\'abord.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                configManager.addOrUpdateServer(guildId, server.channel_id, role?.id || null);

                const embed = new EmbedBuilder()
                    .setColor(0x10b981)
                    .setTitle('✅ Rôle mis à jour')
                    .setDescription(role ? `Rôle à mentionner: <@&${role.id}>` : 'Aucun rôle à mentionner')
                    .setFooter({ text: 'Configuration sauvegardée' });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Erreur config:', error);
                return interaction.reply({
                    content: '❌ Une erreur est survenue lors de la configuration.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (subcommand === 'voir') {
            const server = configManager.getServer(guildId);

            if (!server) {
                return interaction.reply({
                    content: '❌ Ce serveur n\'a pas encore été configuré. Utilisez `/configurer canal`.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x3b82f6)
                .setTitle('⚙️ Configuration actuelle')
                .addFields(
                    { name: 'Canal', value: `<#${server.channel_id}>`, inline: true },
                    { name: 'Rôle', value: server.role_id ? `<@&${server.role_id}>` : 'Aucun', inline: true },
                    { name: 'Fuseau horaire', value: server.timezone || 'Europe/Paris', inline: true },
                    { name: 'Statut', value: server.enabled ? '✅ Actif' : '❌ Inactif', inline: true },
                    { name: 'Configuré le', value: `<t:${Math.floor(new Date(server.created_at).getTime() / 1000)}:f>`, inline: false }
                )
                .setFooter({ text: 'Configuration du serveur' });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'activer') {
            const server = configManager.getServer(guildId);

            if (!server) {
                return interaction.reply({
                    content: '❌ Ce serveur n\'a pas encore été configuré. Utilisez `/configurer canal`.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (server.enabled) {
                return interaction.reply({
                    content: '✅ Le serveur est déjà actif.',
                    flags: MessageFlags.Ephemeral
                });
            }

            configManager.enableServer(guildId);

            const embed = new EmbedBuilder()
                .setColor(0x10b981)
                .setTitle('✅ Serveur activé')
                .setDescription('Les messages quotidiens seront envoyés à partir de demain.')
                .setFooter({ text: 'Configuration mise à jour' });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'desactiver') {
            const server = configManager.getServer(guildId);

            if (!server) {
                return interaction.reply({
                    content: '❌ Ce serveur n\'a pas encore été configuré.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (!server.enabled) {
                return interaction.reply({
                    content: '✅ Le serveur est déjà inactif.',
                    flags: MessageFlags.Ephemeral
                });
            }

            configManager.disableServer(guildId);

            const embed = new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle('⛔ Serveur désactivé')
                .setDescription('Les messages quotidiens ne seront plus envoyés.')
                .setFooter({ text: 'Configuration mise à jour' });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

