# Ben-Learning V4.8 — Parcours personnalisé par niveau

Cette version affiche à chaque élève uniquement les cours, devoirs, séances, quiz et recommandations correspondant à son niveau et à sa section. Un élève de 1ère voit uniquement le contenu 1ère / Tronc commun. Les pages de cours sont aussi protégées contre l’ouverture directe d’une ressource d’un autre niveau.

# Ben-Learning V4.6

## V4.6 — Nettoyage du cours de 1ère année

- Suppression de la page 2 **« Réalisateurs »** du PDF de 1ère année. Le cahier passe de 24 à 23 pages.
- Suppression complète du cours **Culture numérique — 1ère année** du catalogue.
- Les anciens liens vers ce cours sont neutralisés et l’Admin supprime aussi l’éventuel document Firestore d’identifiant `5` lors de la synchronisation.
- La carte 1ère année de l’accueil met désormais en avant **Production numérique, Programmation et Robotique**.
- Cache PWA incrémenté pour forcer la mise à jour du PDF et du catalogue sur smartphone.

## V4.4 — Remplacement du cours de 1ère année

- Les deux anciens cours PDF de 1ère année ont été remplacés par un seul **Cahier d’activités Informatique — 1ère année secondaire**.
- Le nouveau PDF est inclus dans `assets/pdf/cahier-activites-informatique-1ere.pdf`.
- Le cours couvre le projet Smart Cross Road, la 2D/3D, Google SketchUp, les formes simples, le panneau STOP, le rond-point, le passage piéton et le feu de circulation.
- Les anciennes ressources `sketchup.pdf` et `modelisation-3d-smart-cross-road.pdf` ont été retirées du package.

# Ben-Learning V4.2

## V4.3 — Nouveau cours 1ère année : modélisation 3D

- Ajout du PDF **Production numérique — Modélisation 3D avec SketchUp** pour la **1ère année / Tronc commun / Trimestre 1**.
- Le cours couvre la modélisation du cône, de la pyramide et de la sphère, puis le panneau STOP et le projet Smart Cross-Road.
- Le document est inclus dans `assets/pdf/modelisation-3d-smart-cross-road.pdf` et peut être ouvert ou prévisualisé depuis la fiche du cours.
- Le cours précédent **De la 2D vers la 3D** reste disponible.

Plateforme e-learning responsive HTML/CSS/JavaScript avec Firebase Authentication + Firestore, déployable sur GitHub Pages sans Firebase Storage.

## V4.2 — Cours 1ère année + interface Assistant épurée

- Ajout du cours PDF **Production numérique — De la 2D vers la 3D** pour la **1ère année / Tronc commun / Trimestre 1**.
- Le document est inclus dans `assets/pdf/sketchup.pdf` et peut être ouvert ou prévisualisé depuis la fiche du cours.
- Suppression du bloc explicatif « Pourquoi mode local ? » dans l’Assistant pédagogique.

## Vérification email obligatoire (conservée depuis V4.1)

Une inscription étudiante n'est plus suffisante avec une adresse écrite au hasard :

1. l'élève crée son compte ;
2. Firebase envoie un email de vérification ;
3. l'élève clique sur le lien reçu ;
4. Ben-Learning confirme `emailVerified = true` ;
5. seulement ensuite l'Admin peut cliquer sur **Accepter** ;
6. l'accès aux cours/quiz/devoirs/séances reste bloqué tant que l'email n'est pas vérifié ET que l'inscription n'est pas approuvée.

> Cela vérifie que l'élève contrôle réellement la boîte mail utilisée. Une adresse jetable qui reçoit des emails peut toujours être vérifiée ; si tu veux limiter plus tard les domaines autorisés (ex. Gmail/Outlook ou domaine scolaire), ajoute une liste blanche.

## Ce que contient V4.2

- Vérification obligatoire de l'adresse email par Firebase.
- Boutons « J'ai vérifié mon email » et « Renvoyer l'email ».
- Validation Admin bloquée pour les emails non vérifiés.
- Badge Admin : **Vérifié / Non vérifié**.
- Validation des inscriptions : pending / approved / rejected.
- Espace Admin avec liste des élèves, chat et notifications.
- Cours protégés après validation du compte.
- Organisation pédagogique : Niveau → Section → Trimestre → Domaine → Chapitre.
- Cours Admin synchronisés dans Firestore.
- Tableau de bord élève : progression, cours terminés, quiz, activité récente.
- Planning Google Meet.
- Devoirs avec rendu, note et commentaire Admin.
- Assistant « Ben IA » pédagogique.
- PWA installable et responsive iPhone / Android / tablette / PC.

## Collections Firestore

- `users`
- `courses`
- `sessions`
- `homework`
- `homeworkSubmissions`
- `chatMessages`
- `notifications`
- `courseProgress`
- `quizResults`

## Configuration obligatoire

1. Firebase Console → Authentication → Sign-in method → activer **Email/Password**.
2. Firebase Console → Firestore Database → Rules.
3. Remplacer toutes les règles par le contenu de `firestore.rules`.
4. Cliquer sur **Publish / Publier**.
5. Vérifier que ton compte administrateur a `role = "admin"` dans `users/{UID}`.
6. Tester une nouvelle inscription avec une vraie adresse email.
7. Ouvrir l'email Firebase et cliquer sur le lien.
8. Revenir dans Ben-Learning → Statut → **J'ai vérifié mon email**.
9. Dans l'Admin, le badge doit devenir **✓ Vérifié**, puis le bouton **Accepter** devient disponible.

## Anciens comptes

Les anciens étudiants créés avant V4.1 peuvent avoir `emailVerified` absent. Ils devront se connecter, ouvrir `status.html`, renvoyer l'email de vérification puis le confirmer avant de continuer.

## Lancer en local

Ouvrir le dossier avec VS Code et lancer `index.html` avec **Live Server**.

## Déploiement GitHub Pages

```bash
git add .
git commit -m "Ben-Learning V4.4 remplacement cours 1ere"
git push origin main
```

Puis GitHub → Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## Important sur les fichiers

Firebase Storage n'est pas utilisé. Pour partager un PDF/Word à tous les élèves, utiliser un lien public (GitHub, Google Drive partagé, etc.).


## V4.6 — Notifications de chat améliorées
- L’Admin voit automatiquement les élèves qui ont envoyé des messages non lus, avec nom, aperçu et compteur.
- Une alerte in-app apparaît à l’arrivée d’un nouveau message et peut ouvrir directement la conversation.
- Les alertes navigateur sont optionnelles et activables depuis le Dashboard Admin.
- Quand l’Admin répond, l’élève reçoit une notification Firestore cliquable « Ouvrir le chat ».
- Le Dashboard élève affiche le nombre de nouveaux messages du chat.


## V4.9.2 — Installation smartphone
- Bouton Installer Ben-Learning toujours visible sur smartphone tant que la PWA n’est pas installée.
- Android : prompt natif quand disponible, sinon instructions Chrome.
- iPhone/iPad : instructions Safari Partager → Ajouter à l’écran d’accueil.
- Aide spécifique si le site est ouvert depuis WhatsApp/Facebook/Instagram.
- Cache Service Worker renouvelé en V4.9.2.
