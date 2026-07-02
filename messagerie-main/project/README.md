# Messagerie Sécurisée en Ligne

Une application web de messagerie en temps réel avec chiffrement de bout en bout, permettant l'échange de messages texte, vocaux et fichiers.

## 🚀 Fonctionnalités

- **Messagerie temps réel** : Échange instantané de messages
- **Chiffrement de bout en bout** : Utilisation de l'API Web Crypto (AES-GCM)
- **Messages vocaux** : Enregistrement et partage de messages audio
- **Partage de fichiers** : Envoi de fichiers jusqu'à 10MB
- **Interface moderne** : Design responsive et animations fluides
- **Aucune authentification** : Accès direct sans compte utilisateur
- **Glisser-déposer** : Partage de fichiers par drag & drop

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Backend** : Node.js avec WebSocket
- **Chiffrement** : Web Crypto API (AES-GCM)
- **Communication** : WebSocket pour le temps réel

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- Navigateur moderne supportant :
  - WebSocket
  - Web Crypto API
  - MediaRecorder API
  - File API

## 🔧 Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd project
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   ```

4. **Accéder à l'application**
   Ouvrir http://localhost:3000 dans votre navigateur

## 🏗️ Architecture

### Structure des fichiers

```
project/
├── index.html          # Interface utilisateur principale
├── style.css           # Styles CSS
├── main.js             # Application principale
├── crypto.js           # Module de chiffrement
├── websocket.js        # Gestion WebSocket
├── audio.js            # Gestion audio
├── files.js            # Gestion fichiers
├── server.js           # Serveur Node.js
└── package.json        # Dépendances
```

### Modules principaux

- **MessagingApp** (`main.js`) : Application principale
- **CryptoManager** (`crypto.js`) : Chiffrement AES-GCM
- **WebSocketManager** (`websocket.js`) : Communication temps réel
- **AudioManager** (`audio.js`) : Enregistrement vocal
- **FileManager** (`files.js`) : Gestion fichiers

## 🔐 Sécurité

### Chiffrement
- **Algorithme** : AES-GCM 256 bits
- **Clés** : Générées côté client
- **Vecteurs d'initialisation** : Aléatoires pour chaque message
- **Sérialisation** : Base64 pour transmission

### Validation
- **Fichiers** : Vérification taille, type MIME, nom sécurisé
- **Messages** : Échappement HTML, validation JSON
- **Audio** : Formats supportés, gestion erreurs

## 📱 Compatibilité

### Navigateurs supportés
- Chrome 67+
- Firefox 60+
- Safari 11+
- Edge 79+

### Fonctionnalités requises
- WebSocket
- Web Crypto API
- MediaRecorder API
- File API
- Blob API

## 🧪 Tests

### Tests manuels recommandés

1. **Messages texte**
   - Envoi de messages courts et longs
   - Caractères spéciaux et emojis
   - Messages avec sauts de ligne

2. **Messages vocaux**
   - Enregistrement court et long
   - Test avec différents microphones
   - Gestion des erreurs d'accès

3. **Fichiers**
   - Images (JPG, PNG, GIF)
   - Documents (PDF, TXT)
   - Fichiers volumineux (limite 10MB)
   - Types non autorisés

4. **Connexion**
   - Reconnexion automatique
   - Gestion perte connexion
   - Multiples utilisateurs

## 🚨 Limitations

- **Pas de persistance** : Messages perdus après rechargement
- **Taille fichiers** : Maximum 10MB par fichier
- **Utilisateurs** : Pas de gestion de comptes
- **Historique** : Messages visibles uniquement pendant la session

## 🔧 Configuration

### Variables d'environnement
```bash
PORT=3000  # Port du serveur (défaut: 3000)
```

### Limites configurables
- Taille max fichier : 10MB
- Nombre max messages affichés : 100
- Tentatives reconnexion : 5

## 📝 Logs

### Serveur
- Connexions/déconnexions utilisateurs
- Erreurs WebSocket
- Messages rejetés

### Client
- Erreurs chiffrement
- Problèmes audio
- Erreurs fichiers

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 🆘 Support

Pour signaler un bug ou demander une fonctionnalité :
1. Vérifier les issues existantes
2. Créer une nouvelle issue avec détails
3. Inclure navigateur et version

## 🔄 Mises à jour

### Version 1.0.0
- Fonctionnalités de base
- Chiffrement de bout en bout
- Support audio et fichiers
- Interface responsive 