#!/bin/bash

echo "========================================"
echo "  Déploiement Messagerie Sécurisée"
echo "========================================"
echo

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé."
    echo "Veuillez installer Node.js depuis https://nodejs.org/"
    exit 1
fi

echo "Node.js détecté:"
node --version
echo

# Vérifier si npm est disponible
if ! command -v npm &> /dev/null; then
    echo "ERREUR: npm n'est pas disponible."
    exit 1
fi

echo "npm détecté:"
npm --version
echo

# Installer les dépendances
echo "Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: Échec de l'installation des dépendances."
    exit 1
fi

echo
echo "========================================"
echo "  Installation terminée avec succès!"
echo "========================================"
echo
echo "Pour démarrer l'application:"
echo "  1. Ouvrir un terminal dans ce dossier"
echo "  2. Exécuter: npm start"
echo "  3. Ouvrir http://localhost:3000"
echo
echo "Pour arrêter le serveur: Ctrl+C"
echo 