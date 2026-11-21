# ToDoList

Application de gestion de tâches : on ajoute des tâches, on suit leur avancement et on les marque comme terminées.

Ce qu'on peut faire :

- ajouter une tâche avec un titre, une description, une priorité, une échéance et des étiquettes ;
- ranger les tâches dans un tableau à trois colonnes (`List`, `En train de réflechir`, `Fini avec succès !`), avec les flèches ou en les faisant glisser ;
- modifier une tâche, la supprimer (avec quelques secondes pour annuler) ;
- découper une tâche en sous-tâches, avec une barre de progression ;
- chercher par titre, trier, filtrer par étiquette ;
- voir les tâches dans une matrice d'Eisenhower (urgent / important) ;
- consulter quelques statistiques et l'historique de chaque tâche ;
- choisir un thème clair ou sombre (par défaut, celui du système).

Le projet est composé de deux parties :

- **le serveur** (dossier `backend`) : une API écrite avec Node.js et Express, qui enregistre les tâches dans une base MongoDB ;
- **le client** (dossier `client`) : l'interface, écrite avec React et Vite.

## Ce qu'il faut avoir installé

- [Node.js](https://nodejs.org/) (avec npm)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community), installé comme service pour qu'il démarre tout seul. La base doit tourner **en local** sur l'ordinateur : le serveur ne démarre pas sans elle

Pour vérifier que MongoDB tourne sous Windows :

```
Get-Service MongoDB
```

## Installation

À faire une seule fois, depuis le dossier du projet.

Dépendances du serveur :

```
npm install
```

Dépendances du client :

```
cd client
npm install
cd ..
```

Fichier de configuration (adresse de la base et port du serveur) :

```
copy .env.example .env
```

Sous macOS ou Linux, la commande est `cp .env.example .env`.

Le fichier `.env` contient deux lignes :

- `MONGO_URI` : l'adresse de la base, par défaut `mongodb://127.0.0.1:27017/todolist` ;
- `PORT` : le port du serveur, par défaut `5000`.

Le client n'a pas besoin de fichier `.env`, sauf si le port du serveur change : dans ce cas, copier `client/.env.example` en `client/.env` et corriger `VITE_API_URL`.

## Lancer le projet

Il faut deux terminaux ouverts en même temps.

**Terminal 1 : le serveur**

```
npm run dev
```

Le serveur affiche `Connecté à MongoDB` puis `Serveur démarré sur http://localhost:5000`.

**Terminal 2 : le client**

```
cd client
npm run dev
```

Vite affiche l'adresse à ouvrir dans le navigateur, en général `http://localhost:5173`.

**Autres commandes utiles**

| Où | Commande | À quoi elle sert |
|---|---|---|
| racine | `npm start` | lance le serveur sans redémarrage automatique |
| racine | `npm run dev` | lance le serveur avec nodemon (il redémarre à chaque modification) |
| `client` | `npm run dev` | lance l'interface en mode développement |
| `client` | `npm run build` | prépare la version finale de l'interface dans `client/dist` |
| `client` | `npm run preview` | affiche la version construite par `npm run build` |
| `client` | `npm run lint` | vérifie le code du client avec ESLint |

## Vérifier que tout marche

Ouvrir `http://localhost:5000/api/todos` dans le navigateur : la liste des tâches s'affiche au format JSON (`[]` tant qu'il n'y a aucune tâche).

## En cas de problème

**`Impossible de se connecter à MongoDB`** : la base n'est pas lancée. Sous Windows, ouvrir un terminal en administrateur et taper `net start MongoDB`. Vérifier aussi la ligne `MONGO_URI` dans le fichier `.env`.

**Le port 5000 est déjà utilisé** : changer la valeur de `PORT` dans le fichier `.env`, puis relancer le serveur.

## Organisation des dossiers

```
backend/
  model/donnee.js                 Forme d'une tâche dans la base (titre, status, desc, date, priorité,
                                  échéance, sous-tâches, étiquettes, date de fin, historique)
  routes/todoRoutes.js            Adresses de l'API des tâches et des sous-tâches
  controllers/todoController.js   Ce que fait chaque adresse (lire, créer, modifier, supprimer)
  server.js                       Démarrage du serveur et connexion à MongoDB
client/
  index.html                      Page HTML de départ (titre, langue)
  src/main.jsx                    Point d'entrée : applique le thème puis affiche App
  src/App.jsx                     Page principale : charge les tâches et choisit ce qu'il faut afficher
  src/App.css, src/index.css      Styles de l'interface (couleurs et thèmes dans index.css)
  src/components/                 Composants de l'interface (cartes, colonnes, formulaire, matrice...)
  src/services/api.js             Appels au serveur avec axios
  src/statuts.js, priorites.js,   Petites fonctions et constantes partagées
  recherche.js, etiquettes.js,    (status, priorités, tri, étiquettes, matrice,
  matrice.js, statistiques.js,    statistiques, thème)
  theme.js
  .env.example                    Adresse de l'API (à copier en .env seulement si le port change)
.env.example                      Modèle du fichier de configuration du serveur
DOCUMENTATION.md                  Description détaillée de chaque fonction et de chaque composant
```

Le détail de toutes les fonctions et de tous les composants se trouve dans [DOCUMENTATION.md](DOCUMENTATION.md).
