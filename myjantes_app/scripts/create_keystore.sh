#!/bin/bash

# 🔐 Script de Création de Keystore pour MyJantes
# Ce script aide à créer le keystore nécessaire pour signer les APK

echo "🔐 MyJantes - Création du Keystore Android"
echo "=========================================="

# Vérifier que keytool est disponible
if ! command -v keytool &> /dev/null; then
    echo "❌ Erreur: keytool n'est pas installé"
    echo "   keytool fait partie du JDK Java"
    echo "   Installer OpenJDK ou Oracle JDK"
    exit 1
fi

# Aller dans le dossier android/app
cd "$(dirname "$0")/../android/app" || exit

echo "📁 Dossier actuel: $(pwd)"
echo ""

# Vérifier si un keystore existe déjà
if [ -f "upload-keystore.jks" ]; then
    echo "⚠️  Un keystore existe déjà: upload-keystore.jks"
    read -p "Le remplacer ? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Annulation..."
        exit 0
    fi
    echo "🗑️  Suppression de l'ancien keystore..."
    rm upload-keystore.jks
fi

echo "🔧 Création du nouveau keystore..."
echo ""
echo "ℹ️  Informations à fournir:"
echo "   - Mot de passe du keystore (IMPORTANT: le retenir !)"
echo "   - Alias de la clé: 'upload' (recommandé)"
echo "   - Informations sur l'organisation"
echo ""

# Créer le keystore
keytool -genkey -v \
    -keystore upload-keystore.jks \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias upload

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore créé avec succès !"
    echo "📁 Fichier: $(pwd)/upload-keystore.jks"
    
    # Afficher les informations du keystore
    echo ""
    echo "📋 Informations du keystore:"
    keytool -list -v -keystore upload-keystore.jks -alias upload
    
    echo ""
    echo "🔧 Prochaines étapes:"
    echo "   1. Copier android/key.properties.template vers android/key.properties"
    echo "   2. Compléter key.properties avec vos mots de passe"
    echo "   3. Tester le build avec le script build_local.sh"
    echo "   4. Configurer CodeMagic avec ce keystore"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "   - Sauvegarder ce keystore en lieu sûr"
    echo "   - Noter les mots de passe dans un gestionnaire sécurisé"
    echo "   - Ne jamais committer ce fichier dans Git"
    
else
    echo "❌ Erreur lors de la création du keystore"
    exit 1
fi