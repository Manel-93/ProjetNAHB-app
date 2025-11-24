# Projet NAHB (Not Another Hero's Book)

Application web fullstack de type "livre dont vous êtes le héros" permettant de créer et jouer des histoires interactives.

## Architecture

- **Backend** : Node.js + Express
- **Frontend** : React
- **Base de données SQL** : MySQL (phpMyAdmin) - pour les données structurées
- **Base de données NoSQL** : MongoDB - pour les images et le texte des histoires

## Installation

1. Installer les dépendances :
```bash
npm run install-all
```

2. Configurer les variables d'environnement :
- Créer un fichier `.env` dans le dossier `server/` avec :
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` pour MySQL
  - `MONGODB_URI` pour MongoDB
  - `JWT_SECRET` pour l'authentification
  - `PORT` pour le serveur

3. Lancer l'application :
```bash
npm run dev
```

Le serveur backend sera accessible sur `http://localhost:3001`
Le frontend sera accessible sur `http://localhost:3000`

## Fonctionnalités

- Authentification (inscription, connexion, session)
- Création et gestion d'histoires (auteur)
- Création de pages/scènes avec choix
- Lecture d'histoires interactives (lecteur)
- Enregistrement des parties jouées
- Gestion admin (bannir auteurs, suspendre histoires, statistiques)

