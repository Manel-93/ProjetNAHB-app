# NAHB Server

Backend API pour l'application NAHB (Not Another Hero's Book).

## Configuration

1. Copier `.env.example` vers `.env` et configurer les variables :
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` pour MySQL
   - `MONGODB_URI` pour MongoDB
   - `JWT_SECRET` pour l'authentification
   - `PORT` pour le serveur (défaut: 3001)

2. Créer un utilisateur admin :
```bash
npm run create-admin
```

Par défaut, l'admin est créé avec :
- Username: admin
- Email: admin@nahb.com
- Password: admin123

Vous pouvez personnaliser ces valeurs dans le fichier `.env` :
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Installation

```bash
npm install
```

## Démarrage

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3001`

## Structure de la base de données

### MySQL (phpMyAdmin)
- `users` : Utilisateurs (auteurs, lecteurs, admins)
- `stories` : Histoires
- `pages` : Pages/scènes des histoires
- `choices` : Choix entre les pages
- `game_sessions` : Parties jouées

### MongoDB
- `story_content` : Contenu des histoires (référence)
- `page_content` : Texte et images des pages
- `choice_content` : Texte des choix

## API Routes

- `/api/auth` : Authentification (register, login, verify)
- `/api/stories` : Gestion des histoires
- `/api/pages` : Gestion des pages
- `/api/choices` : Gestion des choix
- `/api/play` : Jouer une histoire
- `/api/admin` : Administration (statistiques, bannir, suspendre)

