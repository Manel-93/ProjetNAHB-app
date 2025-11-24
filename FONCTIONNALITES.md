# Fonctionnalités Implémentées - Projet NAHB

## ✅ Lecture d'une histoire (côté lecteur)

### Page listant les histoires publiées
- **Composant** : `client/src/components/StoryList.js`
- **Route API** : `GET /api/stories` (affiche uniquement les histoires publiées et non suspendues)
- **Fonctionnalité** : 
  - Liste toutes les histoires publiées
  - Champ de recherche sur le nom (`GET /api/stories/search?q=...`)
  - Affiche le nombre de parties jouées pour chaque histoire

### Lecture interactive
- **Composant** : `client/src/components/PlayStory.js`
- **Routes API** : 
  - `POST /api/play/start/:storyId` - Démarre une partie
  - `POST /api/play/choose` - Fait un choix et va à la page suivante

**Fonctionnalités implémentées** :
- ✅ Démarrage sur la page de départ (`start_page_id` de l'histoire)
- ✅ Affichage du texte de la page + des choix
- ✅ Clic sur un choix → navigation vers la page suivante correspondante
- ✅ Arrivée sur une page finale clairement indiquée avec message de fin
- ✅ Affichage des images si présentes

## ✅ Enregistrement minimal des parties

- **Table MySQL** : `game_sessions`
- **Champs enregistrés** :
  - ✅ `user_id` : L'utilisateur qui a joué
  - ✅ `story_id` : L'histoire jouée
  - ✅ `ending_page_id` : La page de fin atteinte
  - ✅ `started_at` : Date de début
  - ✅ `ended_at` : Date de fin (enregistrée automatiquement)

**Logique d'enregistrement** :
- La session est créée au démarrage (`POST /api/play/start/:storyId`)
- `ending_page_id` et `ended_at` sont mis à jour quand :
  - Un choix sans `target_page_id` est sélectionné (fin directe)
  - Une page avec `is_ending = true` est atteinte

**Route pour consulter l'historique** :
- `GET /api/play/my-sessions` - Liste toutes les parties de l'utilisateur connecté

## ✅ Gestion de l'app (côté admin)

### Interface Admin
- **Composant** : `client/src/components/AdminPanel.js`
- **Route** : `/admin` (accessible uniquement aux admins)

### Fonctionnalités Admin

#### 1. Bannir un auteur
- **Route API** : `POST /api/admin/ban-author/:userId`
- **Fonctionnalité** : Met `is_banned = TRUE` pour l'utilisateur
- **Effet** : L'utilisateur banni ne peut plus se connecter
- **Débannir** : `POST /api/admin/unban-author/:userId`

#### 2. Suspendre une histoire
- **Route API** : `POST /api/admin/suspend-story/:storyId`
- **Fonctionnalité** : Met `is_suspended = TRUE` pour l'histoire
- **Effet** : L'histoire n'apparaît plus dans la liste publique
- **Réactiver** : `POST /api/admin/unsuspend-story/:storyId`

#### 3. Voir les statistiques
- **Route API** : `GET /api/admin/statistics`
- **Statistiques retournées** :
  - **Globales** :
    - Nombre total d'utilisateurs
    - Nombre total d'histoires
    - Nombre d'histoires publiées
    - Nombre total de parties jouées
    - Nombre total de pages
  - **Par histoire** :
    - Nombre de parties jouées (`play_count`)
    - Nombre de pages
    - Nombre de choix
    - Statut (publié/brouillon)
    - Statut de suspension

#### 4. Liste des utilisateurs
- **Route API** : `GET /api/admin/users`
- **Informations** : ID, username, email, rôle, statut (banni/actif), nombre d'histoires créées, nombre de parties jouées

## Routes API Complètes

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérifier le token

### Histoires
- `GET /api/stories` - Liste des histoires publiées
- `GET /api/stories/search?q=...` - Rechercher des histoires
- `GET /api/stories/:id` - Détails d'une histoire
- `POST /api/stories` - Créer une histoire (authentifié)
- `PUT /api/stories/:id` - Modifier une histoire (auteur ou admin)
- `DELETE /api/stories/:id` - Supprimer une histoire (auteur ou admin)
- `GET /api/stories/my/stories` - Mes histoires (authentifié)

### Pages
- `POST /api/pages` - Créer une page (auteur)
- `GET /api/pages/story/:storyId` - Liste des pages d'une histoire
- `GET /api/pages/:id` - Détails d'une page
- `PUT /api/pages/:id` - Modifier une page (auteur)
- `DELETE /api/pages/:id` - Supprimer une page (auteur)

### Choix
- `POST /api/choices` - Créer un choix (auteur)
- `GET /api/choices/page/:pageId` - Liste des choix d'une page
- `PUT /api/choices/:id` - Modifier un choix (auteur)
- `DELETE /api/choices/:id` - Supprimer un choix (auteur)

### Jeu
- `POST /api/play/start/:storyId` - Démarrer une partie (authentifié)
- `POST /api/play/choose` - Faire un choix (authentifié)
- `GET /api/play/my-sessions` - Mes parties (authentifié)

### Admin
- `GET /api/admin/statistics` - Statistiques globales (admin)
- `GET /api/admin/users` - Liste des utilisateurs (admin)
- `POST /api/admin/ban-author/:userId` - Bannir un auteur (admin)
- `POST /api/admin/unban-author/:userId` - Débannir un auteur (admin)
- `POST /api/admin/suspend-story/:storyId` - Suspendre une histoire (admin)
- `POST /api/admin/unsuspend-story/:storyId` - Réactiver une histoire (admin)

