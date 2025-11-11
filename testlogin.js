require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const token = process.env.DISCORD_TOKEN || '';
if (!token) {
  console.error('DISCORD_TOKEN absent');
  process.exit(1);
}

const client = new Client({ intents: [IntentsBitField.Flags.Guilds] });

client.once('ready', () => {
  console.log('Connecté :', client.user.tag);
  client.destroy();
  process.exit(0);
});

client.login(token).catch(err => {
  console.error('Échec login minimal :', err.code || err.message || err);
  process.exit(1);
});