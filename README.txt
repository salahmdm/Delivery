GESTION LIVREURS — PROTOTYPE ANDROID

Contenu :
- application Android native simple (WebView) embarquant l'interface locale
- ajout/modification/suppression de salariés
- rémunération par journal ou forfait mensuel
- saisie des livraisons quotidiennes
- enregistrement des paiements
- tableau de bord et export/import JSON

IMPORTANT :
Cette version est un prototype local pour un seul appareil. Elle n'a pas de comptes sécurisés,
de synchronisation entre téléphones, ni d'audit complet. Les données restent sur l'appareil.
Ne pas utiliser comme système de paie officiel sans validation des règles métier.

Pour générer l'APK :
1. Installer Android Studio et le JDK requis.
2. Ouvrir le dossier GestionLivreurs dans Android Studio.
3. Laisser Gradle synchroniser et installer Android SDK Platform 35 si demandé.
4. Menu Build > Build Bundle(s) / APK(s) > Build APK(s).
5. L'APK de debug sera généralement dans app/build/outputs/apk/debug/app-debug.apk.

Les montants sont des exemples à configurer par salarié. Le forfait mensuel est calculé comme
forfait + supplément uniquement au-delà du nombre inclus si un tarif supplémentaire est saisi.
Le solde peut être négatif si les paiements saisis dépassent le montant calculé.
