# 🚀 Guide de Démarrage Rapide - APK MyJantes

**Objectif** : Obtenir un APK de test en 15 minutes maximum !

## 📋 Étapes pour APK de Test (Le Plus Rapide)

### 1. Test Local d'Abord (5 minutes)

```bash
# Aller dans le dossier de l'app
cd myjantes_app

# Lancer le script de build (Linux/Mac)
chmod +x scripts/build_local.sh
./scripts/build_local.sh

# Ou sur Windows
scripts/build_local.bat
```

➡️ **Choisir option 1** (Debug APK) pour un APK de test non signé  
➡️ **Résultat** : `build/app/outputs/flutter-apk/app-debug.apk`

### 2. Configuration CodeMagic (10 minutes)

#### A. Connexion à CodeMagic
1. Aller sur https://codemagic.io
2. Se connecter avec GitHub
3. Cliquer "Add application" 
4. Sélectionner votre repository MyJantes

#### B. Configuration Email
Dans `codemagic.yaml`, ligne 40 :
```yaml
recipients:
  - votre-email@example.com  # ⚠️ REMPLACER PAR VOTRE EMAIL
```

#### C. Premier Build
1. Faire un commit et push :
```bash
git add .
git commit -m "feat: setup CodeMagic for APK build"
git push origin main
```

2. Dans CodeMagic, vérifier que le build "Android Test Build" se lance automatiquement

3. Attendre 5-10 minutes ⏰

4. Télécharger l'APK depuis les "Artifacts"

## 🎯 Résultats Attendus

### ✅ Build Local Réussi
- APK créé dans `build/app/outputs/flutter-apk/`
- Taille d'environ 20-50 MB
- Installation possible sur device Android

### ✅ Build CodeMagic Réussi
- Email de notification reçu
- APK téléchargeable depuis le dashboard
- Build automatique à chaque push sur main

## 🚨 Problèmes Courants

### 1. "Flutter not found" localement
```bash
# Vérifier Flutter
flutter doctor

# Si manquant, installer depuis https://flutter.dev
```

### 2. "Build failed" sur CodeMagic
- Vérifier les logs dans CodeMagic
- S'assurer que `pubspec.yaml` est valide
- Vérifier que le repository est public ou accès autorisé

### 3. APK ne s'installe pas
- Activer "Sources inconnues" sur Android
- Vérifier que l'APK n'est pas corrompu (retélécharger)

## 📱 Test de l'APK

### Installation sur Device Android
1. Transférer l'APK sur votre téléphone
2. Aller dans Paramètres > Sécurité > Sources inconnues ✅
3. Ouvrir le fichier APK depuis l'explorateur de fichiers
4. Confirmer l'installation

### Test de Base
- ✅ L'app se lance
- ✅ L'écran d'accueil s'affiche
- ✅ Navigation entre les pages fonctionne
- ✅ Thème sombre MyJantes appliqué

## 🔄 Étapes Suivantes (Optionnel)

Une fois l'APK de test validé :

### Pour Production (APK Signé)
1. Suivre `CODEMAGIC_SETUP_GUIDE.md` section "Configuration Android avec Signature"
2. Créer keystore avec `scripts/create_keystore.sh`
3. Configurer `android/key.properties`
4. Utiliser workflow "android-production" dans CodeMagic

### Pour iOS
1. Avoir un compte Apple Developer
2. Configurer certificats iOS
3. Utiliser workflow "ios-production"

---

## 📞 Aide Rapide

**✅ Test local réussi mais CodeMagic échoue ?**
➡️ Vérifier les logs CodeMagic, souvent un problème de configuration

**✅ APK trop volumineux ?**
➡️ Normal pour debug (~50MB), release sera plus petit (~20MB)

**✅ App crash au lancement ?**
➡️ Vérifier les permissions Android et la compatibilité de version

---

**🎉 Une fois ces étapes terminées, vous avez un APK fonctionnel pour tester MyJantes !**