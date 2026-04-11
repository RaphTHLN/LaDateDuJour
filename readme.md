![Banner](https://raw.githubusercontent.com/RaphTHLN/LaDateDuJour/refs/heads/main/lddj.png)

# 📅 LaDateDuJour

Un bot Discord qui envoie chaque jour un message récapitulatif avec les événements historiques, anniversaires, décès notables et fêtes du jour.

## 🎯 Fonctionnalités

- **Événements historiques** : Récupération depuis Wikipedia API (gratuit & illimité)
- **Anniversaires** : 
  - Anniversaires personnalisés (enregistrés par les utilisateurs)
  - Anniversaires de serveur (gestion par admin)
  - Anniversai.env` à la racine avec :
## 🔑 Configuration

### Variables d'environnement (.env)
- `DISCORD_TOKEN` : Token du bot (Developer Portal → Bot → Copy Token)
- `CHANNEL_ID` : Canal par défaut où envoyer les messages quotidiens (rétro-compatibilité)
- `ROLE_ID` : Rôle à mentionner dans les messages (optionnel)
- `DEBUG_MODE` : `1` pour envoi immédiat, `0` pour envoi à minuit
- `LOCAL_AI_ENABLED` : `1` pour activer l'IA locale (Ollama), `0` pour désactiver
- `LOCAL_AI_URL` : URL du serveur Ollama (défaut: http://localhost:11434)
- `LOCAL_AI_MODEL` : Modèle à utiliser (défaut: gemma2)
- `GEMINI_API_KEY` : Clé API Google Gemini (optionnel, n'est plus utilisée par défaut)

## 🛠️ Commandes disponibles

### Commandes utilisateurs
- `/recherche <sujet>` : Chercher sur Wikipedia
- `/citation` : Obtenir une citation inspirante
- `/tendance` : Voir les tendances du moment
- `/archiver` : Archiver le dernier message du calendrier
- `/anniversaire definir` : Ajouter ton anniversaire
- `/anniversaire voir` : Voir ton anniversaire
- `/anniversaire supprimer` : Supprimer ton anniversaire
- `/anniversaire chercher` : Chercher un anniversaire par jour/mois

### Commandes administrateur
- `/configurer canal` : Définir le canal d'envoi des messages
- `/configurer role` : Définir le rôle à mentionner
- `/configurer voir` : Afficher la configuration du serveur
- `/configurer activer` : Activer les envois pour ce serveur
- `/configurer desactiver` : Désactiver les envois pour ce serveur

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

### "Cannot find module 'wikipedia_helper'"
- Assurez-vous que tous les nouveaux fichiers helpers sont présents
- Relancez `npm install`

### Local AI timeout / Ollama ne répond pas
- Vérifiez qu'Ollama est en cours d'exécution: `ollama serve`
- Vérifiez l'URL dans `.env` : `LOCAL_AI_URL=http://localhost:11434`
- Réglez `LOCAL_AI_ENABLED=0` pour désactiver

### Aucun serveur configuré
- Pour une migration depuis v2: exécutez `/configurer canal #canal` sur chaque serveur
- Ou définissez `CHANNEL_ID` dans le `.env` (fallback automatique)

## 📝 Contribuer

Les contributions sont bienvenues ! N'hésite pas à ouvrir des issues ou des pull requests.

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

**RaphTHLN, Christianf67, Albadev**

---

**Besoin d'aide ?** Ouvre une [issue](https://github.com/RaphTHLN/LaDateDuJour/issues) sur le repo.