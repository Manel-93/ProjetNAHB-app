# Guide d'installation - Projet NAHB

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (phpMyAdmin)
- MongoDB
- npm ou yarn

## Installation

### 1. Installer les dépendances

À la racine du projet :
```bash
npm run install-all
```

Cela installera les dépendances pour :
- Le projet racine
- Le serveur backend (`server/`)
- Le client frontend (`client/`)

### 2. Configuration MySQL

1. Créer une base de données MySQL nommée `nahb_db` (ou le nom de votre choix)
2. Configurer les accès dans `server/.env`

### 3. Configuration MongoDB

1. Démarrer MongoDB localement ou utiliser une instance distante
2. Configurer l'URI dans `server/.env`

### 4. Configuration des variables d'environnement

Créer un fichier `server/.env` basé sur `server/.env.example` :

```env
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nahb_db

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nahb

# JWT Secret
JWT_SECRET=votre_secret_jwt_changez_en_production

# Server Port
PORT=3001

# Admin User (optionnel)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@nahb.com
ADMIN_PASSWORD=admin123
```

### 5. Créer l'utilisateur admin

```bash
cd server
npm run create-admin
```

Cela créera un utilisateur admin avec les identifiants par défaut (ou ceux spécifiés dans `.env`).

### 6. Démarrer l'application

À la racine du projet :
```bash
npm run dev
```

Cela démarrera :
- Le serveur backend sur `http://localhost:3001`
- Le client frontend sur `http://localhost:3000`

## Structure des bases de données

### MySQL (phpMyAdmin)

Les tables sont créées automatiquement au premier démarrage du serveur :
- `users` : Utilisateurs
- `stories` : Histoires
- `pages` : Pages/scènes
- `choices` : Choix entre pages
- `game_sessions` : Parties jouées

### MongoDB

Les collections sont créées automatiquement :
- `story_content` : Références de contenu
- `page_content` : Texte et images des pages
- `choice_content` : Texte des choix

## Utilisation

1. Accéder à l'application : `http://localhost:3000`
2. S'inscrire ou se connecter avec le compte admin
3. Créer une histoire
4. Ajouter des pages et des choix
5. Publier l'histoire
6. Jouer l'histoire !

## Notes

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 7 jours
- Les sessions sont gérées via localStorage côté client
- Les images peuvent être stockées dans MongoDB (à implémenter si nécessaire)

