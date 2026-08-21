# Ben-Learning V2.8

Plateforme e-learning statique (HTML/CSS/JavaScript) avec Firebase Authentication + Firestore.

## Nouveautés V2.8

- Validation des inscriptions par l'administrateur : En attente / Accepté / Refusé.
- Les nouveaux élèves ne peuvent pas ouvrir les cours et quiz avant validation.
- Page de suivi de l'inscription (`status.html`).
- Chat Firebase élève ↔ administration (`chat.html`).
- Centre de notifications (`notifications.html`).
- Notification automatique après acceptation/refus et après une réponse Admin dans le chat.
- Envoi manuel d'une notification à un élève ou à tous depuis l'Admin.
- Compteurs Admin : élèves, inscriptions en attente, messages non lus, cours.

## Important : règles Firestore

Avant de tester V2.8, ouvre Firebase Console > Firestore Database > Rules et publie le contenu du fichier `firestore.rules` fourni dans ce projet.

Sans ces règles, l'acceptation/refus, le chat et les notifications seront refusés par Firebase.

## Flux d'inscription

1. L'élève crée son compte.
2. Son profil Firestore reçoit `role: student` et `status: pending`.
3. Il peut consulter `status.html`, le chat et ses notifications.
4. Les cours et quiz restent bloqués.
5. L'Admin ouvre `admin.html` puis clique **Accepter** ou **Refuser**.
6. L'élève reçoit immédiatement une notification.
7. Si accepté (`status: approved`), l'accès aux cours et quiz est ouvert.

## Compte administrateur

Le compte Admin doit avoir dans `users/{UID}` :

```text
role = "admin"
```

Le premier rôle Admin se configure manuellement dans Firebase Console.

## Collections Firestore utilisées

- `users`
- `chatMessages`
- `notifications`

Elles sont créées automatiquement lors de l'utilisation de la plateforme.

## Lancer en local

Ouvre le dossier avec VS Code puis lance `index.html` avec **Live Server**.


## Nouveautés V2.8
- Bio du créateur en arabe sur la page d’accueil.
- Grand bandeau indiquant que la plateforme est mise à jour continuellement selon les cours et les séances.
- Section Contact pour séances en ligne Google Meet.
- Email : bessembenben2023@gmail.com
- WhatsApp : +216 53 675 201
- Emplacement photo : `assets/images/profil-bessem.svg`. Pour utiliser une vraie photo, remplace la source dans `index.html` ou remplace ce fichier par ton image.


## Photo du créateur
La photo de Bessem est intégrée dans `assets/images/profil-bessem.png` et affichée sur la page d’accueil.


## V2.8.2 — Ultra responsive smartphone
- Menu hamburger animé sur toutes les pages.
- Zones tactiles >= 44 px.
- Formulaires iPhone/Android sans zoom automatique.
- Tableaux Admin scrollables horizontalement.
- Chat, notifications, profil et statut optimisés petit écran.
- Mise en page 320 px à grand écran + safe-area iPhone.
- Réduction automatique des animations si le téléphone demande « réduire les animations ».
