# ToDoList

Application de gestion de tâches : on ajoute des tâches, on suit leur avancement et on les marque comme terminées.

Le projet est en cours de développement. Il est composé de deux parties :

- **le serveur** (dossier `backend`) : une API écrite avec Node.js et Express, qui enregistre les tâches dans une base MongoDB ;
- **le client** (dossier `client`) : l'interface, écrite avec React et Vite.

## Ce qu'il faut avoir installé

- [Node.js](https://nodejs.org/) (avec npm)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community), installé comme service pour qu'il démarre tout seul

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

## Vérifier que tout marche

Ouvrir `http://localhost:5000/api/todos` dans le navigateur : la liste des tâches s'affiche au format JSON (`[]` tant qu'il n'y a aucune tâche).

## En cas de problème

**`Impossible de se connecter à MongoDB`** : la base n'est pas lancée. Sous Windows, ouvrir un terminal en administrateur et taper `net start MongoDB`. Vérifier aussi la ligne `MONGO_URI` dans le fichier `.env`.

**Le port 5000 est déjà utilisé** : changer la valeur de `PORT` dans le fichier `.env`, puis relancer le serveur.

## Organisation des dossiers

```
backend/
  model/donnee.js   Forme d'une tâche dans la base (titre, status, desc, date)
  server.js         Démarrage du serveur et connexion à MongoDB
client/
  src/              Code de l'interface React
.env.example        Modèle du fichier de configuration
```
