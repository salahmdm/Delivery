# Journaux

Application Android (Capacitor) de gestion de livraisons de journaux : salariés, tournées, paie, rentabilité.

## Structure
- `www/index.html` : toute l'application (HTML/CSS/JS). Le début du fichier contient le **module de sécurité** (chiffrement AES-256-GCM, verrou PIN) ; le reste est l'application, exécutée seulement après déverrouillage (balise `<script type="text/plain" id="appsrc">`).
- `capacitor.config.json`, `package.json` : configuration Capacitor 6 et plugins (Filesystem, Haptics, Local Notifications, Share).
- `scripts/android-setup.sh` : crée le dossier `android/`, applique `allowBackup=false`, remet les icônes/splash d'origine (`android-res/`).
- `tests/security.test.js` : tests Chromium (chiffrement, migration de l'ancien PIN, import, sauvegardes).
- `.github/workflows/android.yml` : compilation + signature de l'APK sur GitHub Actions.

## Compiler en local (JDK 17 + Android SDK)
```bash
npm install
npm test                      # facultatif
npm run android:debug         # APK : android/app/build/outputs/apk/debug/app-debug.apk
```

## Compiler avec GitHub Actions
Ajouter dans *Settings → Secrets and variables → Actions* :
- `KEYSTORE_BASE64` : contenu de `journaux-release.p12.base64.txt`
- `KEYSTORE_PASSWORD` : mot de passe du keystore (alias `journaux`)

Chaque push sur `main` produit l'artefact **Journaux-apk**. Ne jamais committer le keystore.

## Signature
Pour que les mises à jour s'installent sans désinstaller, toujours signer avec **le même keystore**.
Les APK signés avec une autre clé (dont l'APK « debug » d'origine) obligent à désinstaller : sauvegardez d'abord (Options → Sauvegarde).

## Sécurité (v40)
Données chiffrées par le code PIN (PBKDF2-SHA256 600 000 it. → AES-256-GCM), code à 6 chiffres, délais après erreurs, sauvegardes chiffrées, validation des imports, CSP, `allowBackup=false`. Un code oublié = données irrécupérables sans sauvegarde.


## Version 45 — cockpit de pilotage
- Nouveau panneau **Analyses** dans Argent : évolution sur six mois, volumes distribués, rentabilité par tournée et salarié, répartition des charges et paies restantes.
- Synthèse partageable et export comptable CSV depuis le panneau d'analyse.
- Rappels visibles sur l'accueil pour les déclarations en attente et les sauvegardes à effectuer.
- Les analyses utilisent les données existantes et ne modifient pas les calculs de paie, les déclarations ni le stockage chiffré.

### Limites fonctionnelles
- La synchronisation cloud multi-appareils nécessite un serveur et une authentification : elle n'est pas activée dans cette version hors ligne.
- Les espaces patron/salarié existants sont conservés ; cette version n'ajoute pas de comptes salariés individuels ni de paie légale certifiée.
- Les rappels sont affichés dans l'application ; aucune notification système n'est programmée sans autorisation explicite.
