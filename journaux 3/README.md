# Journaux — version modernisée

Application de gestion de livraisons de journaux : tournées, salariés, déclarations, paie, charges et rentabilité.

## Nouveautés de la version 42

- Refonte responsive : navigation latérale sur ordinateur et navigation adaptée au mobile.
- Largeur de travail adaptée aux grands écrans, formulaires centrés et tableaux défilants horizontalement sur petit écran.
- États de focus visibles au clavier, prise en compte de `prefers-reduced-motion` et zones tactiles plus confortables.
- Métadonnées de l'application et documentation de compilation clarifiée.
- Les règles métier, le stockage chiffré et le mécanisme de verrouillage d'origine sont conservés.

## Prérequis

- Node.js 20
- JDK 17
- Android SDK (pour une compilation locale Android)
- Git et un compte GitHub (pour la compilation distante)

## Démarrer / vérifier

```bash
npm install
npm test
```

Le test Playwright utilise Chromium. Si nécessaire, installe-le avant le test :

```bash
npx playwright install --with-deps chromium
npm test
```

## Compilation Android locale

```bash
npm install
npm run android:debug
```

APK debug : `android/app/build/outputs/apk/debug/app-debug.apk`

Pour une release :

```bash
npm run android:release
```

Le dossier `android/` est généré par `scripts/android-setup.sh` et n'est pas versionné. Le script synchronise Capacitor et réapplique `android:allowBackup="false"`.

## Compilation GitHub Actions

1. Décompresse le projet et envoie le contenu du dossier `journaux/` dans un dépôt GitHub.
2. Vérifie que le workflow `.github/workflows/android.yml` est présent.
3. Dans GitHub : **Settings → Secrets and variables → Actions**, ajoute :
   - `KEYSTORE_BASE64` : keystore encodé en Base64 (facultatif pour obtenir un APK debug, nécessaire pour une release signée).
   - `KEYSTORE_PASSWORD` : mot de passe du keystore.
4. Pousse sur `main` ou lance manuellement **Actions → Android APK → Run workflow**.
5. Télécharge l'artefact `Journaux-apk` à la fin du workflow.

Le keystore doit être conservé en lieu sûr et ne doit jamais être commité. Pour publier des mises à jour Android sans désinstaller l'application, il faut impérativement signer chaque version avec le même keystore et le même alias (`journaux`).

## Données et sécurité

- Le module de sécurité d'origine reste en place : dérivation PBKDF2-SHA256 et chiffrement AES-256-GCM lorsque le PIN est activé.
- Le PIN oublié ne peut pas être récupéré : conserve une sauvegarde chiffrée dans un emplacement sûr.
- Avant une mise à jour importante, effectue une sauvegarde depuis les options de l'application.
- Ne partage jamais le fichier de keystore ni ses mots de passe.

## Structure

- `www/index.html` : application web autonome (HTML/CSS/JavaScript).
- `capacitor.config.json` : configuration Capacitor.
- `scripts/android-setup.sh` : génération et synchronisation du projet Android.
- `android-res/` : icônes et ressources de démarrage.
- `tests/security.test.js` : tests automatisés du verrouillage, du chiffrement, des imports et des sauvegardes.
- `.github/workflows/android.yml` : compilation et publication de l'APK en artefact GitHub Actions.

## Notes de version

Version applicative : **42.0.0**. Le contenu métier et le modèle de données sont préservés ; cette version ajoute principalement une couche d'interface responsive et de confort d'utilisation.
