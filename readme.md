![Banner](https://raw.githubusercontent.com/RaphTHLN/LaDateDuJour/refs/heads/main/lddj.png)

# 📅 LaDateDuJour

Un bot Discord qui envoie chaque jour un message récapitulatif avec les événements historiques, anniversaires, décès notables et fêtes du jour.

## 🎯 Fonctionnalités

- **Événements historiques** : Récupération automatique des événements importants du jour via Wikipedia/Gemini
- **Anniversaires** : 
  - Anniversaires personnalisés (enregistrés par les utilisateurs)
  - Anniversaires de serveur (gestion par admin)
  - Anniversaires Animal Crossing
- **Décès notables** : Personnalités décédées ce jour
- **Fêtes du jour** : Fêtes religieuses, culturelles et internationales
- **Météo** : Intégration avec Météo Express pour la prévision du lendemain
- **Système de commandes** : Commandes slash pour gérer les anniversaires et événements

## 🚀 Installation

### Prérequis
- Node.js v20+
- npm
- Un bot Discord créé sur le [Developer Portal](https://discord.com/developers/applications)

### Étapes

1. **Clone le repo**
   ```bash
   git clone https://github.com/RaphTHLN/LaDateDuJour.git
   cd LaDateDuJour
   ```

2. **Installe les dépendances**
   ```bash
   npm install
   ```

3. **Configure le .env**
   Crée un fichier `.env` à la racine avec :
   ```env
   DISCORD_TOKEN=TON_BOT_TOKEN
   CHANNEL_ID=ID_DU_CANAL_POUR_LES_MESSAGES
   ROLE_ID=ID_DU_ROLE_A_NOTIFIER
   GEMINI_API_KEY=TA_CLE_API_GOOGLE_GEMINI
   DEBUG_MODE=0
   ```

4. **Lance le bot**
   ```bash
   node index.js
   ```

## 🔑 Configuration

### Variables d'environnement (.env)
- `DISCORD_TOKEN` : Token du bot (Developer Portal → Bot → Copy Token)
- `CHANNEL_ID` : Canal où envoyer les messages quotidiens
- `ROLE_ID` : Rôle à mentionner dans les messages (optionnel)
- `GEMINI_API_KEY` : Clé API Google Gemini pour enrichir les contenus
- `DEBUG_MODE` : `1` pour envoi immédiat, `0` pour envoi à minuit

## 📊 Structure du projet

```
LaDateDuJour/
├── index.js                    # Point d'entrée principal
├── command_manager.js          # Gestion des commandes slash
├── gemini_helper.js            # Intégration Google Gemini
├── modules/                    # Modules de contenu
│   ├── 1-header.js
│   ├── 2-evenements-historiques.js
│   ├── 3-evenements-serveur.js
│   ├── 4-naissances.js
│   ├── 5-naissances-serveur.js
│   ├── 6-naissances-ac.js
│   ├── 7-deces.js
│   └── 8-fetes.js
├── data/                       # Base de données SQLite
│   └── anniversaires.db
├── .env                        # Configuration (à ne pas committer)
└── package.json
```

## 🛠️ Commandes disponibles

- `/anniversaire add` : Ajouter ton anniversaire
- `/anniversaire remove` : Supprimer ton anniversaire
- `/anniversaire list` : Lister les anniversaires du serveur
- `/event add` : Ajouter un événement serveur
- `/event remove` : Supprimer un événement serveur

## 🐛 Troubleshooting

### Module @google/generative-ai manquant
```bash
npm install @google/generative-ai
```

### Le bot ne se connecte pas
- Vérifier que le token est valide : 
  ```powershell
  node testlogin.js
  ```
- Vérifier les permissions du bot sur le serveur
- Vérifier les logs d'erreur dans la console

## 📝 Contribuer

Les contributions sont bienvenues ! N'hésite pas à ouvrir des issues ou des pull requests.

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

**RaphTHLN, Christianf67, Albadev**

---

**Besoin d'aide ?** Ouvre une [issue](https://github.com/RaphTHLN/LaDateDuJour/issues) sur le repo.