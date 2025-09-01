# 🚀 Guide Complet de Configuration CodeMagic pour MyJantes

Ce guide vous accompagne étape par étape pour configurer CodeMagic et générer vos APK/IPA.

## 📋 Prérequis

### 1. Comptes Nécessaires
- [ ] Compte CodeMagic (gratuit : https://codemagic.io)
- [ ] Compte GitHub/GitLab avec votre repository
- [ ] Compte Google Play Console (pour Android en production)
- [ ] Compte Apple Developer (pour iOS en production)

### 2. Outils Locaux
- [ ] Flutter SDK 3.0+ installé
- [ ] Android Studio ou SDK Tools
- [ ] Java JDK 11+ installé
- [ ] Git configuré

## 🔧 Configuration Initiale

### Étape 1 : Connecter votre Repository à CodeMagic

1. **Se connecter à CodeMagic** :
   - Aller sur https://codemagic.io
   - Se connecter avec GitHub/GitLab
   - Autoriser l'accès à vos repositories

2. **Ajouter votre projet** :
   - Cliquer sur "Add application"
   - Sélectionner votre repository MyJantes
   - Choisir "Flutter App" comme type de projet

### Étape 2 : Configuration Android (APK non signé pour test)

La configuration la plus simple pour commencer - **APK non signé** :

```yaml
# Configuration minimale pour APK non signé
workflows:
  android-debug:
    name: Android Debug Build
    instance_type: mac_mini_m1
    max_build_duration: 30
    environment:
      flutter: stable
      xcode: latest
    
    scripts:
      - name: Get Flutter packages
        script: flutter packages pub get
      
      - name: Build debug APK
        script: flutter build apk --debug
    
    artifacts:
      - build/app/outputs/flutter-apk/*.apk
    
    publishing:
      email:
        recipients:
          - votre-email@example.com
```

### Étape 3 : Configuration Android avec Signature (Production)

Pour des APK signés, vous devez créer un keystore :

#### 3.1 Créer un Keystore (Local)

```bash
# Dans le dossier android/app
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Répondre aux questions :
# - Mot de passe du keystore : [choisir un mot de passe fort]
# - Alias : upload
# - Mot de passe de la clé : [même mot de passe ou différent]
# - Nom et organisation : MyJantes
```

#### 3.2 Configurer key.properties

Créer `android/key.properties` :
```properties
storePassword=VOTRE_STORE_PASSWORD
keyPassword=VOTRE_KEY_PASSWORD
keyAlias=upload
storeFile=upload-keystore.jks
```

#### 3.3 Variables d'Environnement CodeMagic

Dans CodeMagic, aller dans :
**App settings > Environment variables**

Ajouter :
- `KEYSTORE_PASSWORD` = votre mot de passe keystore
- `KEY_PASSWORD` = votre mot de passe de clé
- `KEY_ALIAS` = upload

#### 3.4 Upload du Keystore

Dans CodeMagic :
**App settings > Code signing identities > Android**
- Uploader votre fichier `upload-keystore.jks`

### Étape 4 : Configuration iOS (Optionnel)

#### 4.1 Certificats Apple Developer

1. **Certificat de Distribution** :
   - Aller sur https://developer.apple.com
   - Certificates, Identifiers & Profiles
   - Créer un Distribution Certificate

2. **Profil de Provisioning** :
   - Créer un App ID pour `com.myjantes.app`
   - Créer un Distribution Provisioning Profile

3. **Upload dans CodeMagic** :
   - App settings > Code signing identities > iOS
   - Uploader certificat (.p12) et profil (.mobileprovision)

## 🎯 Configuration Recommandée pour Débuter

### Configuration Simple (APK de Test)

Remplacez votre `codemagic.yaml` par cette version simplifiée :

```yaml
workflows:
  android-test:
    name: Android Test Build
    instance_type: mac_mini_m1
    max_build_duration: 30
    environment:
      flutter: stable
    
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: 'main'
          include: true
    
    scripts:
      - name: Get Flutter packages
        script: |
          flutter packages pub get
      
      - name: Build APK
        script: |
          flutter build apk --release
    
    artifacts:
      - build/app/outputs/flutter-apk/*.apk
    
    publishing:
      email:
        recipients:
          - votre-email@myjantes.com
        notify:
          success: true
          failure: true
```

## 🚨 Problèmes Courants et Solutions

### 1. Erreur "Flutter not found"
**Solution** : Vérifier que `flutter: stable` est dans environment

### 2. Erreur de signature Android
**Solution** : 
- Vérifier que le keystore est uploadé
- Vérifier les variables d'environnement
- S'assurer que `android/key.properties` existe

### 3. Build timeout
**Solution** : Augmenter `max_build_duration: 60`

### 4. Erreur de dépendances
**Solution** : 
```yaml
scripts:
  - name: Clean and get packages
    script: |
      flutter clean
      flutter packages pub get
```

### 5. Erreur iOS sans macOS
**Solution** : Utiliser `instance_type: mac_mini_m1` pour iOS

## 📱 Test Local Avant CodeMagic

Avant d'utiliser CodeMagic, testez localement :

```bash
# Nettoyer le projet
flutter clean

# Récupérer les dépendances
flutter pub get

# Tester la compilation
flutter build apk --debug

# Vérifier que l'APK est créé
ls -la build/app/outputs/flutter-apk/
```

## 🔄 Processus de Build Complet

### 1. Push vers GitHub
```bash
git add .
git commit -m "feat: ready for CodeMagic build"
git push origin main
```

### 2. Vérifier le Build
- Aller sur CodeMagic dashboard
- Vérifier que le build se déclenche automatiquement
- Suivre les logs en temps réel

### 3. Télécharger l'APK
- Une fois le build terminé, cliquer sur "Artifacts"
- Télécharger l'APK généré
- Installer sur votre device Android pour tester

## 🎯 Configuration Étape par Étape

### Pour Commencer (APK de Test) :

1. **Connecter Repository** ✅
2. **Utiliser configuration simple** ✅
3. **Push du code** ✅
4. **Premier build** ✅
5. **Télécharger APK** ✅

### Pour Production :

1. **Créer keystore** ✅
2. **Configurer variables** ✅
3. **Upload certificats** ✅
4. **Configuration avancée** ✅
5. **Build signé** ✅

## 📞 Support

### Si ça ne marche toujours pas :

1. **Vérifier les logs CodeMagic** :
   - Cliquer sur le build failed
   - Lire les erreurs dans les logs

2. **Vérifications communes** :
   - `pubspec.yaml` valide
   - Pas d'erreurs Flutter locales
   - Repository public ou accès autorisé

3. **Ressources** :
   - Documentation CodeMagic : https://docs.codemagic.io
   - Support CodeMagic : support@codemagic.io

## ✅ Checklist Finale

Avant de lancer votre premier build :

- [ ] Repository connecté à CodeMagic
- [ ] `codemagic.yaml` présent à la racine
- [ ] Email notifications configuré
- [ ] Push fait vers la branche main
- [ ] Build déclenché automatiquement
- [ ] Logs vérifiés en cas d'erreur
- [ ] APK téléchargé et testé

---

**🎉 Une fois cette configuration terminée, vous aurez des APK automatiques à chaque push !**