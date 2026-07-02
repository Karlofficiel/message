# Guide de Tests Utilisateur - Messagerie Sécurisée

## 🎯 Objectif

Ce guide permet de tester toutes les fonctionnalités de l'application de messagerie sécurisée et d'identifier les problèmes potentiels.

## 📋 Préparation

### Environnement de test
- **Serveur** : Démarré sur http://localhost:3000
- **Navigateurs** : Chrome, Firefox, Safari, Edge
- **Périphériques** : Ordinateur, tablette, mobile
- **Fichiers de test** : Images, documents, fichiers audio

### Données de test
- **Images** : JPG, PNG, GIF, WebP (1KB à 5MB)
- **Documents** : PDF, TXT, DOCX (1KB à 2MB)
- **Audio** : MP3, WAV, OGG (30s à 5min)
- **Fichiers volumineux** : >10MB pour tester les limites

## 🧪 Tests Fonctionnels

### 1. Tests de Connexion

#### 1.1 Connexion initiale
- [ ] Ouvrir http://localhost:3000
- [ ] Vérifier l'affichage du pseudo "InvitéX"
- [ ] Vérifier le statut "Chiffrement activé"
- [ ] Vérifier le compteur d'utilisateurs

#### 1.2 Multiples utilisateurs
- [ ] Ouvrir 3-4 onglets/navigateurs
- [ ] Vérifier que chaque utilisateur a un pseudo unique
- [ ] Vérifier que le compteur s'actualise
- [ ] Fermer un onglet et vérifier la mise à jour

#### 1.3 Reconnexion
- [ ] Fermer la connexion réseau
- [ ] Vérifier l'affichage "Connexion perdue"
- [ ] Rétablir la connexion
- [ ] Vérifier la reconnexion automatique

### 2. Tests de Messages Texte

#### 2.1 Envoi simple
- [ ] Taper un message court
- [ ] Appuyer sur Entrée
- [ ] Vérifier l'affichage immédiat
- [ ] Vérifier le timestamp et le pseudo

#### 2.2 Messages longs
- [ ] Taper un message de 500+ caractères
- [ ] Vérifier l'auto-resize du textarea
- [ ] Vérifier l'affichage complet
- [ ] Tester avec sauts de ligne

#### 2.3 Caractères spéciaux
- [ ] Tester avec emojis 😀🎉
- [ ] Tester avec caractères spéciaux éàçù
- [ ] Tester avec HTML <script>alert('test')</script>
- [ ] Vérifier l'échappement correct

#### 2.4 Limites
- [ ] Tester la limite de 1000 caractères
- [ ] Vérifier le message d'erreur
- [ ] Tester avec message vide

### 3. Tests de Messages Vocaux

#### 3.1 Enregistrement simple
- [ ] Cliquer sur le bouton microphone 🎤
- [ ] Autoriser l'accès au microphone
- [ ] Parler pendant 10 secondes
- [ ] Cliquer sur "Arrêter"
- [ ] Vérifier l'envoi automatique

#### 3.2 Contrôles audio
- [ ] Vérifier l'affichage du player audio
- [ ] Tester play/pause
- [ ] Tester la barre de progression
- [ ] Vérifier le volume

#### 3.3 Gestion d'erreurs
- [ ] Refuser l'accès au microphone
- [ ] Vérifier le message d'erreur
- [ ] Tester sans microphone connecté
- [ ] Tester en mode navigation privée

#### 3.4 Enregistrements longs
- [ ] Enregistrer pendant 2-3 minutes
- [ ] Vérifier la stabilité
- [ ] Tester l'arrêt automatique
- [ ] Vérifier la qualité audio

### 4. Tests de Fichiers

#### 4.1 Upload simple
- [ ] Cliquer sur l'attache 📎
- [ ] Sélectionner une image
- [ ] Vérifier l'affichage du fichier
- [ ] Vérifier les informations (nom, taille)

#### 4.2 Types de fichiers
- [ ] Tester images (JPG, PNG, GIF, WebP)
- [ ] Tester documents (PDF, TXT, DOCX)
- [ ] Tester archives (ZIP, RAR)
- [ ] Tester audio/vidéo (MP3, MP4)

#### 4.3 Glisser-déposer
- [ ] Glisser un fichier sur la zone de chat
- [ ] Vérifier l'affichage de la zone de drop
- [ ] Relâcher le fichier
- [ ] Vérifier l'upload automatique

#### 4.4 Aperçu images
- [ ] Envoyer une image
- [ ] Vérifier l'aperçu dans le chat
- [ ] Tester différentes tailles d'images
- [ ] Vérifier la qualité de l'aperçu

#### 4.5 Téléchargement
- [ ] Cliquer sur "Télécharger"
- [ ] Vérifier le téléchargement
- [ ] Vérifier l'intégrité du fichier
- [ ] Tester avec fichiers chiffrés

#### 4.6 Limites et erreurs
- [ ] Tester fichier >10MB
- [ ] Vérifier le message d'erreur
- [ ] Tester type non autorisé (.exe)
- [ ] Tester nom de fichier dangereux

### 5. Tests de Sécurité

#### 5.1 Chiffrement
- [ ] Vérifier que les messages sont chiffrés
- [ ] Inspecter le trafic réseau (WebSocket)
- [ ] Vérifier que les clés sont générées côté client
- [ ] Tester la déconnexion/reconnexion

#### 5.2 Validation
- [ ] Tester injection HTML
- [ ] Tester injection JavaScript
- [ ] Tester fichiers malveillants
- [ ] Vérifier l'échappement des entrées

#### 5.3 Isolation
- [ ] Vérifier qu'un utilisateur ne voit que ses messages
- [ ] Tester la séparation des sessions
- [ ] Vérifier l'absence de fuites de données

### 6. Tests d'Interface

#### 6.1 Responsive design
- [ ] Tester sur desktop (1920x1080)
- [ ] Tester sur tablette (768px)
- [ ] Tester sur mobile (375px)
- [ ] Vérifier l'adaptation des éléments

#### 6.2 Accessibilité
- [ ] Navigation au clavier (Tab, Entrée)
- [ ] Contraste des couleurs
- [ ] Taille des boutons
- [ ] Messages d'erreur clairs

#### 6.3 Animations
- [ ] Vérifier les animations d'apparition
- [ ] Tester les transitions fluides
- [ ] Vérifier les indicateurs de chargement
- [ ] Tester les notifications

### 7. Tests de Performance

#### 7.1 Charge
- [ ] Envoyer 50+ messages rapidement
- [ ] Vérifier la limitation à 100 messages
- [ ] Tester avec fichiers volumineux
- [ ] Vérifier la stabilité

#### 7.2 Mémoire
- [ ] Utiliser l'application pendant 30 minutes
- [ ] Vérifier l'utilisation mémoire
- [ ] Tester la fermeture/ouverture d'onglets
- [ ] Vérifier le nettoyage des ressources

#### 7.3 Réactivité
- [ ] Tester la latence des messages
- [ ] Vérifier la fluidité de l'interface
- [ ] Tester avec connexion lente
- [ ] Vérifier les timeouts

## 🐛 Tests de Robustesse

### 8.1 Scénarios d'erreur

#### 8.1.1 Perte de connexion
- [ ] Couper le réseau pendant l'envoi
- [ ] Vérifier la gestion d'erreur
- [ ] Rétablir et vérifier la reconnexion
- [ ] Vérifier les messages en attente

#### 8.1.2 Erreurs serveur
- [ ] Arrêter le serveur pendant utilisation
- [ ] Vérifier les messages d'erreur
- [ ] Redémarrer et vérifier la reconnexion
- [ ] Vérifier la récupération

#### 8.1.3 Erreurs navigateur
- [ ] Tester en mode navigation privée
- [ ] Tester avec extensions désactivées
- [ ] Tester avec JavaScript désactivé
- [ ] Vérifier les fallbacks

### 8.2 Tests de compatibilité

#### 8.2.1 Navigateurs
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Edge (dernière version)

#### 8.2.2 Systèmes d'exploitation
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux
- [ ] Mobile (iOS/Android)

## 📊 Rapport de Test

### Template de rapport

```markdown
## Test effectué le [DATE]

### Environnement
- Navigateur : [CHROME/FIREFOX/SAFARI/EDGE]
- Version : [VERSION]
- OS : [WINDOWS/MAC/LINUX]
- Résolution : [RESOLUTION]

### Résultats
- ✅ Tests réussis : [NOMBRE]
- ❌ Tests échoués : [NOMBRE]
- ⚠️ Tests partiels : [NOMBRE]

### Problèmes identifiés
1. [DESCRIPTION DU PROBLÈME]
   - Impact : [FAIBLE/MOYEN/ÉLEVÉ]
   - Reproductible : [OUI/NON]
   - Solution : [PROPOSITION]

### Recommandations
- [RECOMMANDATION 1]
- [RECOMMANDATION 2]
```

## 🎯 Critères de Validation

### Critères obligatoires
- [ ] Tous les messages texte s'envoient et s'affichent
- [ ] Les messages vocaux s'enregistrent et se jouent
- [ ] Les fichiers s'uploadent et se téléchargent
- [ ] Le chiffrement fonctionne correctement
- [ ] L'interface est responsive
- [ ] La reconnexion automatique fonctionne

### Critères de qualité
- [ ] Interface fluide et réactive
- [ ] Messages d'erreur clairs
- [ ] Gestion gracieuse des erreurs
- [ ] Performance acceptable
- [ ] Accessibilité de base

## 🚀 Tests Avancés

### Tests de charge
- [ ] 10+ utilisateurs simultanés
- [ ] Envoi massif de messages
- [ ] Upload simultané de fichiers
- [ ] Test de stress prolongé

### Tests de sécurité avancés
- [ ] Audit de sécurité du code
- [ ] Test de pénétration basique
- [ ] Vérification des headers HTTP
- [ ] Test de vulnérabilités XSS/CSRF 