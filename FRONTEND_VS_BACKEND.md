# Frontend vs Backend - Explication

## 🎨 FRONTEND (Client) - Dossier `client/`

### **C'est quoi ?**
Le **frontend** est la partie **visible** de l'application, ce que l'utilisateur voit et utilise dans son navigateur.

### **Technologies utilisées :**
- **React** : Framework JavaScript pour créer l'interface utilisateur
- **HTML/CSS** : Structure et style des pages
- **JavaScript** : Logique côté client

### **Ce qu'il fait :**
✅ Affiche les pages web (liste d'histoires, formulaire de connexion, etc.)  
✅ Gère les interactions utilisateur (clics, formulaires, navigation)  
✅ Envoie des requêtes au backend pour récupérer/enregistrer des données  
✅ Affiche les résultats retournés par le backend  

### **Fichiers principaux :**
```
client/
├── src/
│   ├── components/          # Composants React (pages, boutons, formulaires)
│   │   ├── Login.js         # Page de connexion
│   │   ├── StoryList.js     # Liste des histoires
│   │   ├── PlayStory.js     # Interface de jeu
│   │   ├── StoryEditor.js   # Éditeur d'histoires
│   │   └── AdminPanel.js    # Panneau admin
│   ├── App.js              # Application principale
│   └── index.js            # Point d'entrée
└── public/
    └── index.html          # Page HTML de base
```

### **Exemple concret :**
Quand tu cliques sur "Jouer une histoire" :
1. Le frontend affiche la page de jeu
2. Il envoie une requête au backend : `POST /api/play/start/1`
3. Le backend répond avec les données de la page
4. Le frontend affiche le texte et les choix à l'utilisateur

---

## ⚙️ BACKEND (Serveur) - Dossier `server/`

### **C'est quoi ?**
Le **backend** est la partie **invisible** qui gère la logique métier, les bases de données et les API.

### **Technologies utilisées :**
- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express** : Framework pour créer l'API REST
- **MySQL** : Base de données relationnelle (phpMyAdmin)
- **MongoDB** : Base de données NoSQL (pour texte/images)
- **JWT** : Authentification par tokens

### **Ce qu'il fait :**
✅ Reçoit les requêtes du frontend  
✅ Vérifie l'authentification (est-ce que l'utilisateur est connecté ?)  
✅ Interroge les bases de données (MySQL et MongoDB)  
✅ Traite la logique métier (créer histoire, jouer, etc.)  
✅ Retourne les données au frontend (JSON)  

### **Fichiers principaux :**
```
server/
├── index.js                 # Point d'entrée du serveur
├── config/
│   └── database.js         # Connexion MySQL + MongoDB
├── routes/                  # Routes API (endpoints)
│   ├── auth.js             # POST /api/auth/login, /register
│   ├── stories.js          # GET/POST/PUT/DELETE /api/stories
│   ├── pages.js            # Gestion des pages
│   ├── choices.js          # Gestion des choix
│   ├── play.js             # Jouer une histoire
│   └── admin.js            # Routes admin
├── middleware/
│   └── auth.js             # Vérification des tokens JWT
└── models/                  # Modèles Mongoose (MongoDB)
    ├── PageContent.js
    ├── ChoiceContent.js
    └── StoryContent.js
```

### **Exemple concret :**
Quand le frontend envoie `POST /api/stories` pour créer une histoire :
1. Le backend vérifie que l'utilisateur est connecté (middleware auth)
2. Il valide les données (titre, description)
3. Il enregistre dans MySQL (table `stories`)
4. Il crée un document dans MongoDB (collection `story_content`)
5. Il retourne un JSON avec l'histoire créée

---

## 🔄 Comment ils communiquent ?

### **Flux de communication :**

```
┌─────────────┐                    ┌─────────────┐
│  FRONTEND   │                    │   BACKEND   │
│  (React)    │                    │  (Express)  │
│             │                    │             │
│  Port 3000  │◄─── HTTP/JSON ────►│ Port 3001   │
└─────────────┘                    └─────────────┘
      │                                    │
      │                                    │
      ▼                                    ▼
┌─────────────┐                    ┌─────────────┐
│  Navigateur │                    │  Bases de    │
│  (Chrome)   │                    │  données    │
└─────────────┘                    │ MySQL +     │
                                    │ MongoDB     │
                                    └─────────────┘
```

### **Exemple complet : Connexion**

1. **Frontend** (`Login.js`) :
   ```javascript
   // L'utilisateur remplit le formulaire et clique sur "Se connecter"
   const response = await axios.post('/api/auth/login', {
     email: 'user@example.com',
     password: 'password123'
   });
   ```

2. **Backend** (`routes/auth.js`) :
   ```javascript
   // Reçoit la requête, vérifie les identifiants
   router.post('/login', async (req, res) => {
     // Vérifie dans MySQL si l'utilisateur existe
     const [users] = await mysqlPool.execute(
       'SELECT * FROM users WHERE email = ?',
       [req.body.email]
     );
     // Vérifie le mot de passe
     // Génère un token JWT
     // Retourne le token et les infos utilisateur
   });
   ```

3. **Frontend** reçoit la réponse :
   ```javascript
   // Stocke le token dans localStorage
   localStorage.setItem('token', response.data.token);
   // Redirige vers la page d'accueil
   navigate('/');
   ```

---

## 📊 Résumé visuel

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Où ?** | Navigateur de l'utilisateur | Serveur distant |
| **Port** | 3000 | 3001 |
| **Rôle** | Interface utilisateur | Logique métier + données |
| **Technologie** | React, HTML, CSS | Node.js, Express |
| **Bases de données** | ❌ N'y accède pas directement | ✅ MySQL + MongoDB |
| **Visible ?** | ✅ Oui (pages web) | ❌ Non (API) |
| **Exemple** | Formulaire de connexion | Vérification du mot de passe |

---

## 🎯 Dans ton projet NAHB

### **Frontend (`client/`) :**
- Page de connexion/inscription
- Liste des histoires publiées
- Interface de jeu (lire une histoire, faire des choix)
- Éditeur d'histoires (créer/modifier pages et choix)
- Panneau admin (statistiques, bannir utilisateurs)

### **Backend (`server/`) :**
- API REST avec routes `/api/auth`, `/api/stories`, etc.
- Authentification JWT
- Gestion MySQL (utilisateurs, histoires, pages, choix, parties)
- Gestion MongoDB (texte des pages, images, texte des choix)
- Validation des données
- Logique métier (créer histoire, jouer, enregistrer parties)

---

## 🚀 Pour démarrer

**Frontend :**
```bash
cd client
npm start
# Ouvre http://localhost:3000
```

**Backend :**
```bash
cd server
npm run dev
# Écoute sur http://localhost:3001
```

**Les deux en même temps :**
```bash
# À la racine du projet
npm run dev
```

---

## 💡 Analogie simple

Imagine un restaurant :

- **Frontend** = La salle du restaurant (ce que le client voit)
  - Menu affiché
  - Tables et chaises
  - Serveur qui prend la commande

- **Backend** = La cuisine (ce que le client ne voit pas)
  - Cuisiniers qui préparent
  - Réfrigérateur (base de données)
  - Gestion des stocks

Le client (utilisateur) voit la salle (frontend) et commande, mais c'est la cuisine (backend) qui prépare et gère tout !

