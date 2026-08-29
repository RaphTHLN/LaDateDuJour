const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('testerjour')
        .setDescription('Envoie manuellement la date du jour dans le canal configuré')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const { sendDailyMessageForServer } = require('../index');
            const server = await sendDailyMessageForServer(interaction.guildId);
            await interaction.editReply(`✅ La date du jour a été envoyée dans <#${server.channel_id}>.`);
        } catch (error) {
            console.error('Erreur lors du test de la date du jour:', error);
            await interaction.editReply(`❌ Échec de l’envoi : ${error.message}`);
        }
    }
};
