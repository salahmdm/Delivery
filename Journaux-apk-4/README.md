# Journaux

Application Android (Capacitor) : livraisons, paie et rentabilité.
L'application se trouve dans `www/index.html`. Les données restent sur le téléphone.

## APK de test (sans rien configurer)
1. Créez un dépôt GitHub et envoyez-y tout le contenu de ce dossier (y compris `.github`).
2. Onglet **Actions** > **Build APK** : le workflow démarre à chaque envoi (ou **Run workflow**).
3. Téléchargez l'artefact **Journaux-apk-debug** (`app-debug.apk`) et installez-le sur le téléphone.

Le workflow lance d'abord les tests de calcul (`npm test`), puis crée l'icône et l'écran de démarrage depuis le dossier `assets`.

## Version signée (APK + bundle Play Store)
1. Créez une clé (une seule fois, gardez le fichier et les mots de passe en lieu sûr) :
   `keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias journaux`
2. Encodez-la : `base64 -w0 release.jks` (sur Mac : `base64 -i release.jks`).
3. Dans GitHub : Settings > Secrets and variables > Actions, ajoutez
   `KEYSTORE_BASE64` (le texte encodé), `KEYSTORE_PASSWORD`, `KEY_ALIAS` (journaux) et `KEY_PASSWORD`.
4. Relancez le workflow : l'artefact **Journaux-release** contient `Journaux-release.apk` et `Journaux-release.aab`.

Perdre la clé empêche de mettre à jour l'application plus tard : sauvegardez-la.

## Sauvegarde automatique
Chaque semaine, l'application enregistre un fichier dans `Documents/Journaux` (les 8 derniers sont gardés).
Si Android refuse l'accès à Documents, le fichier va dans l'espace privé de l'application : il disparaît alors à la désinstallation.
Faites aussi une sauvegarde manuelle (Paramètres) avant de changer de téléphone.
