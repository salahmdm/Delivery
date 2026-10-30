#!/usr/bin/env bash
# Génère / met à jour le projet Android natif (dossier android/, non versionné) à partir de www/.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm ci 2>/dev/null || npm install
[ -d android ] || npx cap add android
npx cap sync android

APP=android/app/src/main
# Sécurité : pas de sauvegarde Android automatique (les données sont chiffrées par le code PIN de l'app)
sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$APP/AndroidManifest.xml"
grep -q 'android:allowBackup="false"' "$APP/AndroidManifest.xml" || { echo "allowBackup non modifié"; exit 1; }

# Icônes et écrans de démarrage d'origine
cp -r android-res/. "$APP/res/"
echo "Projet Android prêt : cd android && ./gradlew assembleDebug"
