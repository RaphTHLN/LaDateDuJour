![Banner](https://raw.githubusercontent.com/RaphTHLN/LaDateDuJour/refs/heads/main/lddj.png)

# LaDateDuJour : Ton bot Discord qui te rend plus intelligent chaque matin (ou pas) !

Marre de rater l'anniversaire de ta grand-mère ou d'oublier la Journée Mondiale du Kebab ? **LaDateDuJour** est là pour sauver ta vie sociale (et ta culture générale) ! Ce bot Discord, concocté avec amour par **AlbaDev**, **Christian** et **Raphaël**, te balance chaque jour à minuit pétante une dose fraîche d'événements historiques, d'anniversaires de stars, de décès marquants, de fêtes improbables et de journées internationales. Finies les boulettes, bonjour la culture !

---

## 💡 L'idée qui a tout changé (merci le StaaRCord !)

L'idée ? Elle est tombée du ciel... ou plutôt, elle a germé dans les cerveaux bouillonnants des membres du [StaaRCord](https://discord.gg/staar) !

---

## ✨ Ce que LaDateDuJour fait pour toi

* **⏰ Publication automatique** : Chaque jour, à 00H00 pile (pas de retard, promis !), le bot poste toutes les infos dans le channel de ton choix.
* **📜 Événements historiques** : De l'Antiquité à hier, pour briller en société avec des faits stylés.
* **🎂 Anniversaires de personnalités** : Pour savoir quel rappeur est né le même jour que toi, ou juste pour te sentir moins seul.
* **⚰️ Décès marquants** : Un moment de recueillement, mais toujours avec une touche de culture générale.
* **🥳 Fêtes et journées internationales** : Parce que oui, la journée du chat existe, et le bot te le rappellera !
* **🐶 Anniversaires des habitants Animal Crossing** : Pour ne jamais rater l'anniv' de Didi, Rosie ou Raymond et leur souhaiter un joyeux non-anniversaire ! (Parce que oui, ils le méritent).

---

## 🚀 Comment faire tourner LaDateDuJour sur ton serveur ?

Pour installer ce petit bijou chez toi, suis le guide :

1.  **Crée ton fichier `.env`** : À la racine de ton projet, crée un fichier nommé `.env` et ajoute-y ton token de bot Discord comme ceci :
    ```
    TOKEN=TON_TOKEN_DE_BOT_ICI
    ```

2.  **Configure `index.js`** : Ouvre le fichier `index.js` et modifie les valeurs des constantes `channelId` et `roleId` avec l'ID du salon et l'ID du rôle où le bot doit publier et mentionner.
    ```javascript
    const channelId = 'TON_ID_DE_CHANNEL'; // L'ID du salon où le bot va poster
    const roleId = 'TON_ID_DE_ROLE';       // L'ID du rôle à mentionner (ex: @everyone ou un rôle spécifique)
    ```

3.  **Installe Node.js et les dépendances** : Si ce n'est pas déjà fait, installe [Node.js](https://nodejs.org/fr). Ensuite, ouvre ton terminal dans le dossier du projet et tape cette commande pour récupérer toutes les dépendances :
    ```bash
    npm install
    ```

4.  **Lance le bot !** : Une fois les dépendances installées, il ne te reste plus qu'à lancer le bot :
    ```bash
    node index.js
    ```
---
