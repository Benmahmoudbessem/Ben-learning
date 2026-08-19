# Ben-Learning V2.3

Plateforme e-learning statique, prête pour VS Code et GitHub Pages.

## Fonctionnalités
- Accueil professionnel et responsive
- Catalogue dynamique de cours avec recherche et filtres
- Niveaux : 1ère, 2ème, 3ème et Bac
- Sections pour 2ème, 3ème et Bac : Informatique, Sciences, Économie, Lettres et Technique
- Fiche de cours avec chapitres, exercices, fichier du cours et vidéo YouTube
- Inscription / connexion étudiant en mode démo localStorage
- Tableau de bord : cours terminés, progression, scores et historique quiz
- Quiz QCM avec correction automatique
- Espace administrateur : ajouter, modifier et supprimer des cours
- Ajout d'un fichier de cours depuis le PC : PDF, Word, PowerPoint, Excel, TXT ou ZIP
- Aucun Firebase Storage requis

## Test local
Le chargement des fichiers JSON nécessite un petit serveur local.
Dans VS Code, installe l'extension **Live Server**, puis clic droit sur `index.html` > **Open with Live Server**.

## Administration
- Email : `admin@ben-learning.com`
- Mot de passe : `admin123`

> Ces identifiants sont un mode démo. Pour une vraie publication, l'authentification Admin doit être remplacée par Firebase Authentication + rôle Admin dans Firestore.

## Ajouter un cours depuis ton PC
Dans `admin.html` :
1. Choisis le niveau : 2ème, 3ème ou Bac.
2. Choisis la section : Informatique, Sciences, Économie, Lettres ou Technique.
3. Remplis le titre, le domaine et la description.
4. Dans **Ajouter le fichier du cours depuis mon PC**, choisis ton PDF/Word/PowerPoint/etc.
5. Clique sur **Enregistrer**.

Le fichier est enregistré dans **IndexedDB**, c'est-à-dire dans le navigateur de cet ordinateur.

### Important pour GitHub Pages
Un fichier choisi directement depuis ton PC n'est pas automatiquement envoyé sur GitHub et ne sera donc pas visible par les élèves utilisant un autre ordinateur ou téléphone. C'est une limitation de sécurité du navigateur, pas de Ben-Learning.

Pour rendre un fichier disponible à tous gratuitement :
- ajoute-le dans `assets/pdf/` dans ton dépôt GitHub puis indique son chemin, par exemple `assets/pdf/python.pdf`, ou
- utilise un lien public/externe dans le champ **Lien du fichier en ligne**.

## Vidéos
Utilise de préférence YouTube en mode non répertorié puis colle le lien dans l'espace Admin.

## Firebase
`js/firebase.example.js` montre où mettre ta configuration pour migrer l'authentification et les données vers Firebase Authentication + Firestore, sans utiliser Firebase Storage.

## GitHub Pages
1. Crée un dépôt GitHub.
2. Envoie tous les fichiers du projet.
3. Settings > Pages.
4. Source : Deploy from a branch.
5. Branch : `main` / `(root)`.
6. Save.

## V2.4 — Firebase + gestion des inscriptions

Cette version utilise le projet Firebase `ben-mahmoud-learning` fourni par le propriétaire du projet.

- Les inscriptions utilisent Firebase Authentication Email/Password.
- Chaque inscription crée aussi un document `users/{uid}` dans Firestore.
- L'espace Admin affiche en temps réel les utilisateurs dont `role = student`.
- Le rôle administrateur est vérifié depuis Firestore : `users/{uid}.role = "admin"`.
- Les règles proposées sont dans `firestore.rules`.
- Lis `FIREBASE-ADMIN-SETUP.txt` avant le premier accès administrateur.

Les fichiers de cours choisis depuis le PC restent stockés localement dans IndexedDB, comme dans V2.3. Firebase Storage n'est pas utilisé.
