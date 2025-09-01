@echo off
REM 🚀 Script de Build Local pour MyJantes (Windows)
REM Ce script permet de compiler l'APK localement avant d'utiliser CodeMagic

echo 🚀 MyJantes - Build Local APK
echo ================================

REM Vérifier que Flutter est installé
flutter --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Flutter n'est pas installé ou pas dans le PATH
    echo    Installer Flutter depuis: https://flutter.dev/docs/get-started/install
    pause
    exit /b 1
)

REM Afficher la version Flutter
echo 📱 Version Flutter:
flutter --version
echo.

REM Aller dans le dossier de l'app
cd /d "%~dp0.."

REM Nettoyer le projet
echo 🧹 Nettoyage du projet...
flutter clean

REM Récupérer les dépendances
echo 📦 Récupération des dépendances...
flutter pub get

REM Vérifier qu'il n'y a pas d'erreurs
echo 🔍 Analyse du code...
flutter analyze
if errorlevel 1 (
    echo ⚠️  Attention: Il y a des problèmes dans le code
    set /p "continue=Continuer quand même ? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

REM Demander le type de build
echo.
echo 🔧 Type de build:
echo 1. Debug APK (non signé, pour test)
echo 2. Release APK (signé, pour production)
set /p "buildtype=Choisir (1 ou 2): "

if "%buildtype%"=="1" (
    REM Build Debug
    echo 🔨 Build Debug APK (non signé)...
    flutter build apk --debug
    
    if errorlevel 1 (
        echo ❌ Erreur lors du build Debug
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Build Debug réussi !
    echo 📱 APK créé: build\app\outputs\flutter-apk\app-debug.apk
    
    REM Afficher la taille du fichier
    if exist "build\app\outputs\flutter-apk\app-debug.apk" (
        for %%A in ("build\app\outputs\flutter-apk\app-debug.apk") do echo 📊 Taille: %%~zA bytes
    )
    
) else if "%buildtype%"=="2" (
    REM Vérifier la configuration de signature
    if not exist "android\key.properties" (
        echo ❌ Erreur: Fichier android\key.properties manquant
        echo    1. Copier android\key.properties.template vers android\key.properties
        echo    2. Compléter avec vos informations de keystore
        echo    3. Créer le keystore si nécessaire
        pause
        exit /b 1
    )
    
    if not exist "android\app\upload-keystore.jks" (
        echo ❌ Erreur: Keystore android\app\upload-keystore.jks manquant
        echo    Créer le keystore avec:
        echo    keytool -genkey -v -keystore android\app\upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
        pause
        exit /b 1
    )
    
    REM Build Release
    echo 🔨 Build Release APK (signé)...
    flutter build apk --release
    
    if errorlevel 1 (
        echo ❌ Erreur lors du build Release
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Build Release réussi !
    echo 📱 APK créé: build\app\outputs\flutter-apk\app-release.apk
    
    REM Afficher la taille du fichier
    if exist "build\app\outputs\flutter-apk\app-release.apk" (
        for %%A in ("build\app\outputs\flutter-apk\app-release.apk") do echo 📊 Taille: %%~zA bytes
    )
    
    echo.
    echo 🎉 APK prêt pour la distribution !
) else (
    echo ❌ Choix invalide
    pause
    exit /b 1
)

echo.
echo 🎯 Prochaines étapes:
echo    1. Tester l'APK sur un device Android
echo    2. Si OK, configurer CodeMagic pour les builds automatiques
echo    3. Voir CODEMAGIC_SETUP_GUIDE.md pour la configuration
echo.
echo ✨ Build terminé avec succès !
pause