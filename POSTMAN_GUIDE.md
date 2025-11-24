# Guide Postman - Test des Endpoints NAHB

## Configuration de base

**Base URL** : `http://localhost:3001/api`

## Variables Postman (recommandé)

Créer un environnement Postman avec :
- `base_url` = `http://localhost:3001/api`
- `token` = (sera rempli après connexion)

## 1. Authentification

### Inscription
```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Réponse** : Token JWT + informations utilisateur

### Connexion
```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Réponse** : Token JWT + informations utilisateur

**⚠️ Important** : Copier le token de la réponse et l'ajouter dans les headers des requêtes suivantes :
```
Authorization: Bearer <votre_token>
```

### Vérifier le token
```
GET {{base_url}}/auth/verify
Authorization: Bearer {{token}}
```

## 2. Gestion des histoires

### Créer une histoire
```
POST {{base_url}}/stories
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Mon histoire",
  "description": "Une histoire passionnante",
  "tags": "aventure, mystère",
  "status": "draft"
}
```

### Lister les histoires publiées
```
GET {{base_url}}/stories
Authorization: Bearer {{token}}
```

### Rechercher des histoires
```
GET {{base_url}}/stories/search?q=aventure
Authorization: Bearer {{token}}
```

### Obtenir une histoire
```
GET {{base_url}}/stories/1
Authorization: Bearer {{token}}
```

### Modifier une histoire
```
PUT {{base_url}}/stories/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Titre modifié",
  "status": "published",
  "start_page_id": 1
}
```

### Supprimer une histoire
```
DELETE {{base_url}}/stories/1
Authorization: Bearer {{token}}
```

### Mes histoires
```
GET {{base_url}}/stories/my/stories
Authorization: Bearer {{token}}
```

## 3. Gestion des pages

### Créer une page
```
POST {{base_url}}/pages
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "story_id": 1,
  "is_ending": false
}
```

### Obtenir les pages d'une histoire
```
GET {{base_url}}/pages/story/1
Authorization: Bearer {{token}}
```

### Modifier une page (texte et images)
```
PUT {{base_url}}/pages/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "text": "Vous êtes dans une forêt sombre...",
  "images": ["url_image1.jpg"],
  "is_ending": false
}
```

### Supprimer une page
```
DELETE {{base_url}}/pages/1
Authorization: Bearer {{token}}
```

## 4. Gestion des choix

### Créer un choix
```
POST {{base_url}}/choices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "page_id": 1,
  "target_page_id": 2,
  "text": "Aller vers la clairière"
}
```

**Note** : Si `target_page_id` est `null`, le choix mène à une fin.

### Obtenir les choix d'une page
```
GET {{base_url}}/choices/page/1
Authorization: Bearer {{token}}
```

### Modifier un choix
```
PUT {{base_url}}/choices/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "target_page_id": 3,
  "text": "Texte modifié"
}
```

### Supprimer un choix
```
DELETE {{base_url}}/choices/1
Authorization: Bearer {{token}}
```

## 5. Jouer une histoire

### Démarrer une partie
```
POST {{base_url}}/play/start/1
Authorization: Bearer {{token}}
```

**Réponse** :
- `session_id` : ID de la session
- `page` : Page de départ avec texte et images
- `choices` : Liste des choix disponibles
- `is_ending` : Si c'est une page finale

### Faire un choix
```
POST {{base_url}}/play/choose
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "session_id": 1,
  "choice_id": 1
}
```

**Réponse** :
- `page` : Nouvelle page avec texte et images
- `choices` : Nouveaux choix disponibles
- `is_ending` : Si c'est une page finale
- `message` : "Story ended" si fin atteinte

### Mes parties
```
GET {{base_url}}/play/my-sessions
Authorization: Bearer {{token}}
```

## 6. Administration (nécessite rôle admin)

### Statistiques globales
```
GET {{base_url}}/admin/statistics
Authorization: Bearer {{token}}
```

**Réponse** :
- `global_statistics` : Stats globales (utilisateurs, histoires, parties, etc.)
- `story_statistics` : Stats par histoire (play_count, page_count, etc.)

### Liste des utilisateurs
```
GET {{base_url}}/admin/users
Authorization: Bearer {{token}}
```

### Bannir un auteur
```
POST {{base_url}}/admin/ban-author/2
Authorization: Bearer {{token}}
```

### Débannir un auteur
```
POST {{base_url}}/admin/unban-author/2
Authorization: Bearer {{token}}
```

### Suspendre une histoire
```
POST {{base_url}}/admin/suspend-story/1
Authorization: Bearer {{token}}
```

### Réactiver une histoire
```
POST {{base_url}}/admin/unsuspend-story/1
Authorization: Bearer {{token}}
```

## Collection Postman

### Workflow complet recommandé

1. **Créer un compte admin** (via script `npm run create-admin` dans `server/`)

2. **Se connecter en tant qu'admin**
   ```
   POST /api/auth/login
   {
     "email": "admin@nahb.com",
     "password": "admin123"
   }
   ```
   → Copier le token

3. **Créer une histoire**
   ```
   POST /api/stories
   Authorization: Bearer <token>
   {
     "title": "Mon histoire",
     "description": "Description",
     "status": "draft"
   }
   ```
   → Noter l'ID de l'histoire

4. **Créer des pages**
   ```
   POST /api/pages
   {
     "story_id": 1,
     "is_ending": false
   }
   ```
   → Noter les IDs des pages

5. **Ajouter du contenu aux pages**
   ```
   PUT /api/pages/1
   {
     "text": "Vous êtes dans une forêt..."
   }
   ```

6. **Créer des choix**
   ```
   POST /api/choices
   {
     "page_id": 1,
     "target_page_id": 2,
     "text": "Aller vers la clairière"
   }
   ```

7. **Définir la page de départ**
   ```
   PUT /api/stories/1
   {
     "start_page_id": 1
   }
   ```

8. **Publier l'histoire**
   ```
   PUT /api/stories/1
   {
     "status": "published"
   }
   ```

9. **Jouer l'histoire**
   ```
   POST /api/play/start/1
   ```
   → Utiliser le `session_id` et `choice_id` pour continuer

10. **Vérifier les statistiques**
    ```
    GET /api/admin/statistics
    ```
    → Vérifier que `play_count` a augmenté

## Codes de réponse

- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de validation
- `401` : Non authentifié
- `403` : Accès refusé (pas les permissions)
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## Notes importantes

- Toutes les routes (sauf `/auth/register`, `/auth/login`, `/auth/verify`) nécessitent un token JWT
- Les routes admin nécessitent le rôle `admin`
- Les auteurs ne peuvent modifier que leurs propres histoires
- Les histoires suspendues n'apparaissent pas dans la liste publique
- Les utilisateurs bannis ne peuvent pas se connecter

