# Ben-Learning V4.0

Plateforme e-learning responsive HTML/CSS/JavaScript avec Firebase Authentication + Firestore, déployable sur GitHub Pages sans Firebase Storage.

## Ce que contient V4.0

- Validation des inscriptions : pending / approved / rejected.
- Espace Admin avec liste des élèves, chat et notifications.
- Cours protégés après validation du compte.
- Organisation pédagogique : Niveau → Section → Trimestre → Domaine → Chapitre.
- Cours Admin synchronisés dans Firestore pour être visibles sur les autres appareils.
- Fichier local possible côté Admin pour prévisualisation ; pour le partager aux élèves, utiliser un lien public.
- Tableau de bord élève : progression, cours terminés, quiz, activité récente.
- Quiz par domaine et historique des scores.
- Planning de séances avec lien Google Meet.
- Devoirs : sujet, date limite, réponse texte/lien, rendu, note et commentaire de l'Admin.
- Notifications automatiques pour nouvelles séances, nouveaux devoirs et corrections.
- Assistant pédagogique « Ben IA » en mode local gratuit : recommandations basées sur progression, quiz, planning et devoirs.
- PWA installable sur smartphone/PC (manifest + service worker).
- Interface ultra-responsive iPhone / Android / tablette / PC.

## Pourquoi l'assistant est en mode local ?

Le site est hébergé sur GitHub Pages et le projet doit rester gratuit. Une clé d'API d'IA ne doit jamais être placée dans un fichier JavaScript public. Le mode local fonctionne sans clé et utilise les données pédagogiques de l'élève. Une IA générative externe pourra être ajoutée plus tard avec un backend sécurisé.

## Collections Firestore V4.0

- `users`
- `courses`
- `sessions`
- `homework`
- `homeworkSubmissions`
- `chatMessages`
- `notifications`
- `courseProgress`
- `quizResults`

Les collections sont créées automatiquement lorsqu'une donnée est enregistrée.

## Configuration obligatoire

1. Firebase Console → Authentication → Sign-in method → activer Email/Password.
2. Firebase Console → Firestore Database → Rules.
3. Remplacer toutes les règles par le contenu de `firestore.rules`.
4. Cliquer sur **Publish / Publier**.
5. Vérifier que le compte administrateur a `role = "admin"` dans `users/{UID}`.

## Lancer en local

Ouvrir le dossier avec VS Code et lancer `index.html` avec **Live Server**.

## Déploiement GitHub Pages

```bash
git add .
git commit -m "Ben-Learning V4.0"
git push origin main
```

Puis GitHub → Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## Installation PWA

- Android/Chrome/Edge : le bouton « Installer Ben-Learning » apparaît quand le navigateur autorise l'installation.
- iPhone/Safari : Partager → Ajouter à l'écran d'accueil.

## Important sur les fichiers

Firebase Storage n'est pas utilisé. Un fichier choisi depuis le PC dans l'Admin est stocké localement dans IndexedDB sur cet appareil uniquement. Pour qu'un PDF/Word soit accessible à tous les élèves, utiliser un lien public (GitHub, Google Drive partagé, etc.).
