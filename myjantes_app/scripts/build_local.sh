#!/bin/bash

# 🚀 Script de Build Local pour MyJantes
# Ce script permet de compiler l'APK localement avant d'utiliser CodeMagic

echo "🚀 MyJantes - Build Local APK"
echo "================================"

# Vérifier que Flutter est installé
if ! command -v flutter &> /dev/null; then
    echo "❌ Erreur: Flutter n'est pas installé ou pas dans le PATH"
    echo "   Installer Flutter depuis: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Afficher la version Flutter
echo "📱 Version Flutter:"
flutter --version
echo ""

# Aller dans le dossier de l'app
cd "$(dirname "$0")/.." || exit

# Nettoyer le projet
echo "🧹 Nettoyage du projet..."
flutter clean

# Récupérer les dépendances
echo "📦 Récupération des dépendances..."
flutter pub get

# Vérifier qu'il n'y a pas d'erreurs
echo "🔍 Analyse du code..."
flutter analyze
if [ $? -ne 0 ]; then
    echo "⚠️  Attention: Il y a des problèmes dans le code"
    read -p "Continuer quand même ? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Demander le type de build
echo ""
echo "🔧 Type de build:"
echo "1. Debug APK (non signé, pour test)"
echo "2. Release APK (signé, pour production)"
read -p "Choisir (1 ou 2): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[1]$ ]]; then
    # Build Debug
    echo "🔨 Build Debug APK (non signé)..."
    flutter build apk --debug
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Build Debug réussi !"
        echo "📱 APK créé: build/app/outputs/flutter-apk/app-debug.apk"
        
        # Afficher la taille du fichier
        if [ -f "build/app/outputs/flutter-apk/app-debug.apk" ]; then
            size=$(ls -lh build/app/outputs/flutter-apk/app-debug.apk | awk '{print $5}')
            echo "📊 Taille: $size"
        fi
    else
        echo "❌ Erreur lors du build Debug"
        exit 1
    fi
    
elif [[ $REPLY =~ ^[2]$ ]]; then
    # Vérifier la configuration de signature
    if [ ! -f "android/key.properties" ]; then
        echo "❌ Erreur: Fichier android/key.properties manquant"
        echo "   1. Copier android/key.properties.template vers android/key.properties"
        echo "   2. Compléter avec vos informations de keystore"
        echo "   3. Créer le keystore si nécessaire"
        exit 1
    fi
    
    if [ ! -f "android/app/upload-keystore.jks" ]; then
        echo "❌ Erreur: Keystore android/app/upload-keystore.jks manquant"
        echo "   Créer le keystore avec:"
        echo "   keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload"
        exit 1
    fi
    
    # Build Release
    echo "🔨 Build Release APK (signé)..."
    flutter build apk --release
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Build Release réussi !"
        echo "📱 APK créé: build/app/outputs/flutter-apk/app-release.apk"
        
        # Afficher la taille du fichier
        if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
            size=$(ls -lh build/app/outputs/flutter-apk/app-release.apk | awk '{print $5}')
            echo "📊 Taille: $size"
        fi
        
        echo ""
        echo "🎉 APK prêt pour la distribution !"
    else
        echo "❌ Erreur lors du build Release"
        exit 1
    fi
else
    echo "❌ Choix invalide"
    exit 1
fi

echo ""
echo "🎯 Prochaines étapes:"
echo "   1. Tester l'APK sur un device Android"
echo "   2. Si OK, configurer CodeMagic pour les builds automatiques"
echo "   3. Voir CODEMAGIC_SETUP_GUIDE.md pour la configuration"
echo ""
echo "✨ Build terminé avec succès !"