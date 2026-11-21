# Documentation du projet ToDoList

Ce fichier explique, une par une, les fonctions et les composants du projet : ce qu'ils font, ce qu'ils reçoivent, ce qu'ils renvoient et où ils sont utilisés.

Pour installer et lancer le projet, voir le [README](README.md).

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Le serveur (backend)](#2-le-serveur-backend)
   - [server.js](#serverjs)
   - [model/donnee.js](#modeldonneejs)
   - [routes/todoRoutes.js](#routestodoroutesjs)
   - [controllers/todoController.js](#controllerstodocontrollerjs)
3. [Le client (interface)](#3-le-client-interface)
   - [main.jsx](#mainjsx)
   - [services/api.js](#servicesapijs)
   - [Fichiers d'aide](#fichiers-daide)
   - [App.jsx](#appjsx)
   - [Composants](#composants)
   - [Styles](#styles)

---

## 1. Vue d'ensemble

Le projet est coupé en deux :

- **le serveur** (`backend/`) reçoit des requêtes HTTP, lit et écrit les tâches dans MongoDB, puis répond en JSON ;
- **le client** (`client/`) est une page React. Il demande les tâches au serveur avec axios et les affiche.

Le chemin d'une action, par exemple « cocher une sous-tâche » :

```
Clic dans la carte (SousTaches.jsx)
  → services/api.js envoie PUT /api/todos/:id/sous-taches/:idSousTache
    → routes/todoRoutes.js choisit la fonction modifierSousTache
      → controllers/todoController.js modifie la tâche dans MongoDB
    ← le serveur renvoie la tâche complète en JSON
← App.jsx remplace l'ancienne tâche par la nouvelle, l'écran se met à jour
```

### Forme d'une tâche

Voici à quoi ressemble une tâche renvoyée par le serveur :

```json
{
  "_id": "6740f1c2a1b2c3d4e5f60718",
  "titre": "Réviser les graphes",
  "desc": "Chapitres 3 et 4",
  "status": "En train de réflechir",
  "date": "2026-11-18T09:12:00.000Z",
  "priorite": "haute",
  "echeance": "2026-11-25T00:00:00.000Z",
  "sousTaches": [{ "_id": "...", "texte": "Dijkstra", "fait": true }],
  "etiquettes": ["fac", "algo"],
  "dateFin": null,
  "historique": [
    { "action": "creation", "detail": "", "date": "2026-11-18T09:12:00.000Z" },
    { "action": "status", "detail": "List → En train de réflechir", "date": "2026-11-19T14:02:00.000Z" }
  ]
}
```

### Les adresses de l'API

Toutes les adresses commencent par `http://localhost:5000/api/todos`.

| Méthode | Adresse | Ce qu'elle fait | Réponse si tout va bien |
|---|---|---|---|
| GET | `/api/todos` | liste toutes les tâches, la plus récente en premier | 200 + tableau de tâches |
| POST | `/api/todos` | crée une tâche | 201 + la tâche créée |
| PUT | `/api/todos/:id` | modifie les champs envoyés d'une tâche | 200 + la tâche modifiée |
| DELETE | `/api/todos/:id` | supprime une tâche | 200 + la tâche supprimée |
| POST | `/api/todos/:id/sous-taches` | ajoute une sous-tâche | 201 + la tâche complète |
| PUT | `/api/todos/:id/sous-taches/:idSousTache` | coche, décoche ou renomme une sous-tâche | 200 + la tâche complète |
| DELETE | `/api/todos/:id/sous-taches/:idSousTache` | supprime une sous-tâche | 200 + la tâche complète |

En cas de problème, le serveur répond toujours avec un objet `{ "message": "..." }` en français :

- **400** : les données envoyées ne sont pas bonnes (titre vide, status inconnu, date invalide...) ;
- **404** : la tâche ou la sous-tâche n'existe pas (ou l'id est mal écrit) ;
- **500** : une erreur du côté de la base de données.

---

## 2. Le serveur (backend)

### server.js

Le fichier qui démarre tout. Il :

1. lit le fichier `.env` avec dotenv (`MONGO_URI` et `PORT`) ;
2. crée l'application Express ;
3. active `cors()` pour que le client (qui tourne sur un autre port) ait le droit d'appeler le serveur ;
4. active `express.json()` pour pouvoir lire le JSON envoyé dans les requêtes ;
5. branche toutes les routes des tâches sur `/api/todos`.

Valeurs par défaut si le `.env` est absent : port `5000` et base `mongodb://127.0.0.1:27017/todolist`.

#### `demarrer()`

- **Ce qu'elle fait** : se connecte à MongoDB, puis lance le serveur sur le port choisi. Si MongoDB ne répond pas au bout de 5 secondes, elle affiche un message d'erreur en français et arrête le programme (`process.exit(1)`).
- **Reçoit** : rien.
- **Renvoie** : rien (c'est une fonction `async`, elle renvoie une promesse que personne n'attend).
- **Utilisée** : appelée une seule fois, à la fin du fichier.

Messages affichés dans le terminal :

- `Connecté à MongoDB : ...` puis `Serveur démarré sur http://localhost:5000` quand tout va bien ;
- `Impossible de se connecter à MongoDB.` suivi d'un conseil et du détail de l'erreur sinon.

### model/donnee.js

Décrit la forme d'une tâche dans la base avec Mongoose. Le fichier exporte le modèle `Todo_obj` (la collection MongoDB s'appelle donc `todo_objs`).

#### Schéma `sousTache`

Une sous-tâche rangée à l'intérieur de la tâche.

| Champ | Type | Détail |
|---|---|---|
| `texte` | texte | obligatoire, espaces autour enlevés |
| `fait` | booléen | `false` par défaut |

Mongoose donne à chaque sous-tâche son propre `_id`, ce qui permet de la retrouver pour la cocher ou la supprimer.

#### Schéma `action`

Une ligne de l'historique d'une tâche (sans `_id`, on n'en a pas besoin).

| Champ | Type | Détail |
|---|---|---|
| `action` | texte | `'creation'`, `'status'` ou `'modification'` |
| `detail` | texte | précision, par exemple `List → Fini avec succès !` ou `titre, priorité` |
| `date` | date | moment de l'action, `Date.now` par défaut |

#### Schéma `donnee` (la tâche)

| Champ | Type | Valeur par défaut | Détail |
|---|---|---|---|
| `titre` | texte | – | obligatoire |
| `status` | texte | `'List'` | `'List'`, `'En train de réflechir'` ou `'Fini avec succès !'` |
| `desc` | texte | – | description facultative |
| `date` | date | maintenant | date de création |
| `priorite` | texte | `'moyenne'` | `'basse'`, `'moyenne'` ou `'haute'` |
| `echeance` | date | `null` | date limite (le jour choisi, enregistré à minuit UTC) |
| `sousTaches` | tableau de `sousTache` | `[]` | |
| `etiquettes` | tableau de textes | `[]` | en minuscules, sans doublon |
| `dateFin` | date | `null` | posée quand la tâche passe à `'Fini avec succès !'` |
| `historique` | tableau de `action` | `[]` | de la plus ancienne à la plus récente, 50 lignes au maximum |

### routes/todoRoutes.js

Associe chaque adresse à une fonction du contrôleur. Ce fichier ne contient aucune logique : il crée un `express.Router()`, déclare les sept routes du tableau [plus haut](#les-adresses-de-lapi) et l'exporte. Il est branché sur `/api/todos` dans `server.js`.

### controllers/todoController.js

Toute la logique du serveur : vérifier ce qui est reçu, parler à la base, choisir le bon code HTTP.

#### Constantes

- `STATUS_AUTORISES` et `PRIORITES_AUTORISEES` : les valeurs permises, lues directement dans le modèle (si on change le modèle, la vérification suit).
- `STATUS_FINI` : `'Fini avec succès !'`.
- `MAX_HISTORIQUE` : 50, le nombre de lignes gardées dans l'historique.
- `NOMS_CHAMPS` : le nom affiché de chaque champ dans l'historique (`desc` devient `description`, `priorite` devient `priorité`...).
- `MAX_ETIQUETTES` (10) et `LONGUEUR_MAX_ETIQUETTE` (30) : limites des étiquettes.

#### Fonctions d'aide (non exportées)

##### `lireEcheance(echeance)`

- **Ce qu'elle fait** : vérifie la date d'échéance reçue.
- **Reçoit** : ce que le client a envoyé dans `echeance` (normalement un texte `"AAAA-MM-JJ"`, ou `null`, ou `''`).
- **Renvoie** : `null` pour « pas d'échéance », un objet `Date` si la date est correcte, ou `undefined` si elle est invalide.
- **Utilisée dans** : `creerTache` et `modifierTache`.

##### `enTexte(valeur)`

- **Ce qu'elle fait** : transforme une valeur en texte pour comparer facilement l'ancienne et la nouvelle valeur d'un champ.
- **Reçoit** : n'importe quelle valeur (texte, date, tableau, `null`...).
- **Renvoie** : un texte. Une date devient son nombre de millisecondes, un tableau devient `"a,b"`, `null` et `undefined` deviennent `''`.
- **Utilisée dans** : `actionsHistorique`.

##### `actionsHistorique(ancienne, modifications)`

- **Ce qu'elle fait** : regarde ce qui a vraiment changé dans une tâche et prépare les lignes d'historique correspondantes.
- **Reçoit** : la tâche telle qu'elle est dans la base, et l'objet des champs à modifier.
- **Renvoie** : un tableau de lignes (0, 1 ou 2) :
  - une ligne `status` si le status change, par exemple `List → Fini avec succès !` ;
  - une ligne `modification` qui liste les autres champs modifiés, par exemple `titre, échéance`.

  Si on renvoie la même valeur qu'avant, rien n'est ajouté.
- **Utilisée dans** : `modifierTache`.

##### `lireEtiquettes(etiquettes)`

- **Ce qu'elle fait** : vérifie et nettoie la liste d'étiquettes reçue : espaces enlevés, minuscules, étiquettes vides et doublons retirés.
- **Reçoit** : normalement un tableau de textes.
- **Renvoie** : le tableau nettoyé si tout va bien, ou **un texte** contenant le message d'erreur (pas un tableau, une étiquette de plus de 30 caractères, plus de 10 étiquettes). L'appelant regarde donc si le résultat est un texte pour savoir s'il y a une erreur.
- **Utilisée dans** : `creerTache` et `modifierTache`.

##### `trouverTache(req, res)`

- **Ce qu'elle fait** : retrouve la tâche dont l'id est dans l'URL.
- **Reçoit** : la requête et la réponse Express.
- **Renvoie** : la tâche (document Mongoose), ou `null` après avoir déjà répondu 404 au client.
- **Utilisée dans** : les trois fonctions des sous-tâches.

##### `trouverSousTache(tache, req, res)`

- **Ce qu'elle fait** : retrouve dans la tâche la sous-tâche dont l'id est dans l'URL (`idSousTache`).
- **Reçoit** : la tâche, la requête et la réponse.
- **Renvoie** : la sous-tâche, ou `null` après avoir répondu 404 (`Sous-tâche introuvable.`).
- **Utilisée dans** : `modifierSousTache` et `supprimerSousTache`.

#### Fonctions des routes (exportées)

Toutes reçoivent `(req, res)` comme n'importe quelle fonction de route Express et répondent en JSON. En cas d'erreur de la base, elles écrivent l'erreur dans le terminal et répondent 500.

##### `listerTaches`

- **Route** : `GET /api/todos`.
- **Ce qu'elle fait** : récupère toutes les tâches, triées de la plus récente à la plus ancienne (`sort({ date: -1 })`).
- **Renvoie** : 200 + le tableau des tâches.

##### `creerTache`

- **Route** : `POST /api/todos`.
- **Reçoit dans le corps** : `titre` (obligatoire), et en option `desc`, `status`, `priorite`, `echeance`, `etiquettes`.
- **Vérifie** : titre non vide, status et priorité dans la liste permise, échéance valide, étiquettes valides. Sinon : 400 avec un message.
- **Ce qu'elle fait en plus** : met une première ligne `creation` dans l'historique, et pose `dateFin` tout de suite si la tâche est créée directement comme finie.
- **Renvoie** : 201 + la tâche créée (avec son `_id`).

##### `modifierTache`

- **Route** : `PUT /api/todos/:id`.
- **Reçoit dans le corps** : un ou plusieurs champs parmi `titre`, `desc`, `status`, `priorite`, `echeance`, `etiquettes`. Seuls les champs envoyés changent. Pour les étiquettes, il faut envoyer la liste complète.
- **Vérifie** : mêmes règles que pour la création ; id mal formé ou inconnu : 404.
- **Ce qu'elle fait en plus** :
  - pose `dateFin` quand la tâche devient finie, l'enlève si elle repart dans une autre colonne ;
  - ajoute les lignes calculées par `actionsHistorique` et ne garde que les 50 dernières (`$push` avec `$slice`).
- **Renvoie** : 200 + la tâche après modification.

##### `supprimerTache`

- **Route** : `DELETE /api/todos/:id`.
- **Ce qu'elle fait** : supprime la tâche.
- **Renvoie** : 200 + la tâche supprimée, ou 404 si elle n'existe pas.

##### `ajouterSousTache`

- **Route** : `POST /api/todos/:id/sous-taches`.
- **Reçoit dans le corps** : `texte` (obligatoire, sinon 400).
- **Ce qu'elle fait** : ajoute une sous-tâche non cochée à la fin de la liste.
- **Renvoie** : 201 + la tâche complète.

##### `modifierSousTache`

- **Route** : `PUT /api/todos/:id/sous-taches/:idSousTache`.
- **Reçoit dans le corps** : `fait` (`true` ou `false`) et/ou `texte`.
- **Ce qu'elle fait** : coche, décoche ou renomme la sous-tâche.
- **Renvoie** : 200 + la tâche complète, 400 si `fait` n'est pas un booléen ou si le texte est vide, 404 si la tâche ou la sous-tâche n'existe pas.

##### `supprimerSousTache`

- **Route** : `DELETE /api/todos/:id/sous-taches/:idSousTache`.
- **Ce qu'elle fait** : enlève la sous-tâche de la tâche.
- **Renvoie** : 200 + la tâche complète, ou 404.

---

## 3. Le client (interface)

Le client est fait avec React (composants sous forme de fonctions et hooks `useState`, `useEffect`, `useRef`), axios pour les requêtes et lucide-react pour les icônes.

### main.jsx

Le point d'entrée du client. Il applique le thème enregistré (`appliquerTheme(lireTheme())`) **avant** le premier affichage, pour éviter que la page clignote en clair puis en sombre, puis affiche le composant `App` dans la balise `<div id="root">` de `index.html`.

### services/api.js

Toutes les requêtes vers le serveur passent par ce fichier. Il crée une instance axios dont l'adresse de base est `VITE_API_URL` (fichier `client/.env`) ou, par défaut, `http://localhost:5000/api`.

Toutes les fonctions `async` renvoient `reponse.data`, c'est-à-dire le JSON du serveur. Si le serveur répond une erreur, axios lance une exception : le message du serveur est alors dans `erreur.response.data.message`.

| Fonction | Reçoit | Requête | Renvoie | Utilisée dans |
|---|---|---|---|---|
| `recupererTaches()` | rien | GET `/todos` | le tableau des tâches | `App` |
| `ajouterTache(tache)` | objet `{ titre, desc, priorite, echeance, etiquettes }` | POST `/todos` | la tâche créée | `FormulaireAjout` |
| `modifierTache(id, modifications)` | l'id et les champs à changer | PUT `/todos/:id` | la tâche modifiée | `App`, `Etiquettes` |
| `supprimerTache(id)` | l'id | DELETE `/todos/:id` | la tâche supprimée | `App` |
| `supprimerTacheAvantFermeture(id)` | l'id | DELETE avec `fetch` et `keepalive` | rien | `App` |
| `ajouterSousTache(id, texte)` | l'id de la tâche et le texte | POST `/todos/:id/sous-taches` | la tâche complète | `SousTaches` |
| `modifierSousTache(id, idSousTache, modifications)` | les deux id et `{ fait }` ou `{ texte }` | PUT `/todos/:id/sous-taches/:idSousTache` | la tâche complète | `SousTaches` |
| `supprimerSousTache(id, idSousTache)` | les deux id | DELETE `/todos/:id/sous-taches/:idSousTache` | la tâche complète | `SousTaches` |

`supprimerTacheAvantFermeture` est un cas spécial : quand on ferme l'onglet pendant les 5 secondes où l'on peut encore annuler une suppression, une requête axios normale serait coupée. `fetch` avec l'option `keepalive` demande au navigateur de terminer la requête même après la fermeture.

### Fichiers d'aide

Petits fichiers de constantes et de fonctions sans affichage, partagés par plusieurs composants.

#### statuts.js

- **`STATUTS`** : les trois status dans l'ordre des colonnes. Chaque élément contient `valeur` (le texte enregistré dans la base et affiché en haut de la colonne) et `classe` (la classe CSS qui donne la couleur : `colonne-liste`, `colonne-encours`, `colonne-fini`).
- **Utilisé dans** : `App`, `CarteTache` (pour trouver la colonne de gauche et de droite), `statistiques.js`.

#### priorites.js

- **`PRIORITES`** : les trois priorités, chacune avec `valeur` (`basse`...) et `texte` (`Basse`...). Utilisé pour remplir les listes déroulantes de `FormulaireAjout` et de `CarteTache`.
- **`textePriorite(valeur)`** : reçoit `'basse'`, `'moyenne'` ou `'haute'`, renvoie le texte affiché (`'Moyenne'` si la valeur est vide ou inconnue). Utilisée dans `CarteTache`.
- **`dateDansJours(nombreDeJours)`** : renvoie la date d'aujourd'hui plus `nombreDeJours` jours, au format `"AAAA-MM-JJ"` (le format des champs `<input type="date">`). Un nombre négatif donne une date passée. Utilisée dans `matrice.js` et `statistiques.js`.
- **`aujourdhui()`** : la date du jour au format `"AAAA-MM-JJ"`.
- **`echeanceEnTexte(echeance)`** : reçoit l'échéance venant de la base, renvoie `"AAAA-MM-JJ"` ou `''` s'il n'y en a pas. La date est lue en UTC, car le serveur enregistre le jour choisi à minuit UTC : sans cela, un utilisateur en France pourrait voir la veille.
- **`estEnRetard(tache)`** : renvoie `true` si l'échéance est passée et que la tâche n'est pas finie. Utilisée dans `CarteTache` pour colorer la carte.

Astuce utilisée un peu partout : deux dates au format `"AAAA-MM-JJ"` se comparent directement comme des textes (`"2026-11-20" < "2026-11-21"`).

#### recherche.js

- **`TRIS`** : les trois tris proposés (`date`, `echeance`, `priorite`) avec leur texte. Utilisé dans `BarreRecherche`.
- **`normaliser(texte)`** (interne) : met un texte en minuscules et enlève les accents, pour que « reflechir » trouve « Réfléchir ».
- **`filtrerParTitre(taches, recherche)`** : reçoit les tâches et le texte tapé, renvoie seulement celles dont le titre contient ce texte (toutes si le texte est vide). Utilisée dans `App`.
- **`comparerDates`, `comparerEcheances`, `comparerPriorites`** (internes) : fonctions de comparaison pour `sort()`. La plus récente d'abord ; l'échéance la plus proche d'abord (les tâches sans échéance à la fin) ; la priorité haute d'abord. En cas d'égalité, c'est la date de création qui départage.
- **`trierTaches(taches, tri)`** : renvoie une **copie** triée du tableau (l'original n'est pas modifié, ce qui est important avec l'état React). Utilisée dans `App`.

#### etiquettes.js

- **`classeCouleur(etiquette)`** : renvoie une classe CSS de `etiquette-couleur-0` à `etiquette-couleur-5`. Le calcul additionne les codes des lettres et garde le reste de la division par 6 : une même étiquette a donc toujours la même couleur, sans rien enregistrer. Utilisée dans `Etiquettes` et `FiltreEtiquettes`.
- **`nettoyerEtiquette(texte)`** : enlève les espaces autour et met en minuscules (comme le serveur).
- **`lireListeEtiquettes(texte)`** : transforme le texte du formulaire d'ajout, par exemple `"travail, Perso , travail"`, en `['travail', 'perso']`. Utilisée dans `FormulaireAjout`.
- **`toutesLesEtiquettes(taches)`** : renvoie toutes les étiquettes utilisées par au moins une tâche, sans doublon et par ordre alphabétique. Utilisée dans `App` pour la rangée de filtres.
- **`filtrerParEtiquette(taches, etiquette)`** : garde les tâches qui ont cette étiquette (toutes si `etiquette` vaut `''`). Utilisée dans `App`.

#### matrice.js

- **`QUADRANTS`** : les quatre cases de la matrice d'Eisenhower dans l'ordre d'affichage, avec `valeur` (`faire`, `planifier`, `deleguer`, `eliminer`), `titre`, `conseil` et `classe` CSS.
- **`estImportante(tache)`** : `true` si la priorité est haute.
- **`estUrgente(tache)`** : `true` si la tâche a une échéance dans les 2 prochains jours ou déjà dépassée. Sans échéance, la tâche n'est pas urgente.
- **`quadrantDeLaTache(tache)`** : combine les deux fonctions précédentes et renvoie la valeur de la case (`'faire'` si importante et urgente, `'planifier'` si seulement importante, `'deleguer'` si seulement urgente, `'eliminer'` sinon).
- **Utilisé dans** : `MatriceEisenhower`.

#### statistiques.js

- **`NOMBRE_JOURS`** : 7, le nombre de jours du graphique.
- **`jourLocal(date)`** (interne) : transforme une date en `"AAAA-MM-JJ"` selon l'heure de l'ordinateur (une tâche finie à 23h30 compte pour ce jour-là).
- **`finiesParJour(taches)`** : renvoie un tableau de 7 éléments `{ jour, date, nombre }`, du plus ancien jour à aujourd'hui, avec le nombre de tâches finies chaque jour (d'après `dateFin`).
- **`totauxParStatut(taches)`** : renvoie les trois status (`valeur`, `classe`) avec en plus `nombre`, le nombre de tâches dans chacun.
- **`finiesSansDate(taches)`** : compte les tâches finies qui n'ont pas de `dateFin` (finies avant que cette date existe). Elles ne peuvent pas apparaître dans le graphique, le panneau le signale.
- **Utilisé dans** : `PanneauStatistiques`.

#### theme.js

Le thème vaut `'systeme'` (par défaut), `'clair'` ou `'sombre'`. Le choix est gardé dans le `localStorage` du navigateur sous la clé `todolist-theme`.

- **`THEMES`** : `['systeme', 'clair', 'sombre']`, l'ordre suivi par le bouton.
- **`lireTheme()`** : renvoie le thème enregistré, ou `'systeme'` si rien n'est enregistré ou si le `localStorage` est bloqué (navigation privée).
- **`appliquerTheme(theme)`** : pose l'attribut `data-theme` sur la balise `<html>` (ou l'enlève en mode système) et enregistre le choix. Le CSS de `index.css` change les couleurs selon cet attribut.
- **`themeSuivant(theme)`** : renvoie le thème suivant dans la boucle système → clair → sombre → système.
- **Utilisé dans** : `main.jsx` et `ChoixTheme`.

### App.jsx

Le composant principal. Il garde toutes les tâches dans son état et décide quoi afficher.

#### Son état

| Variable | Rôle |
|---|---|
| `taches` | toutes les tâches reçues du serveur |
| `chargement` | `true` pendant le premier chargement |
| `erreur` | message affiché si le serveur ne répond pas (`''` sinon) |
| `notification` | la notification en bas de l'écran (`{ cle, message, annulable }`) ou `null` |
| `suppressionEnAttente` | (`useRef`) la tâche retirée de l'écran et son minuteur de 5 secondes |
| `recherche` | le texte tapé dans la barre de recherche |
| `tri` | le tri choisi (`'date'`, `'echeance'` ou `'priorite'`) |
| `etiquetteChoisie` | l'étiquette du filtre (`''` = toutes) |
| `tacheGlissee` | la tâche en train d'être glissée, pour éclairer les colonnes qui peuvent la recevoir |
| `vue` | `'tableau'` ou `'matrice'` |

`DUREE_ANNULATION` vaut 5000 ms : c'est le temps pour annuler une suppression, et la durée d'affichage des autres notifications.

#### Ses fonctions

- **`trierParDate(taches)`** (en dehors du composant) : renvoie une copie triée de la plus récente à la plus ancienne. Sert à remettre une tâche à sa place après une annulation.
- **`chargerTaches()`** : appelle `recupererTaches()`, range le résultat dans `taches`, ou remplit `erreur` si le serveur ne répond pas. Appelée au premier affichage (`useEffect`) et par `reessayer`.
- **`reessayer()`** : bouton « Réessayer » de l'écran d'erreur.
- **`ajouterALaListe(tache)`** : met la tâche créée en haut de la liste, sans recharger la page. Passée à `FormulaireAjout`.
- **`remplacerDansLaListe(tacheModifiee)`** : remplace la tâche qui a le même `_id`. Passée aux cartes sous le nom `onMiseAJour` (sous-tâches, étiquettes).
- **`changerStatus(tache, nouveauStatus)`** : déplace la carte tout de suite à l'écran, puis prévient le serveur. Si le serveur refuse, la carte revient à sa place et une notification l'explique. Utilisée par les flèches des cartes et par le glisser-déposer.
- **`deposerTache(id, nouveauStatus)`** : appelée quand une carte est lâchée dans une colonne. Retrouve la tâche par son id et appelle `changerStatus` si la colonne est différente.
- **`enregistrerModification(tache, modifications)`** : envoie titre, description, priorité et échéance au serveur et met la liste à jour. En cas d'erreur, l'exception remonte jusqu'à la carte qui affiche le message.
- **`remettreDansLaListe(tache)`** : remet une tâche dans la liste à sa place d'origine.
- **`demanderSuppression(tache)`** : clic sur la corbeille. La tâche disparaît de l'écran, une notification « Annuler » apparaît, et la vraie suppression n'est envoyée qu'après 5 secondes. S'il y avait déjà une suppression en attente, elle est validée tout de suite (une seule à la fois).
- **`validerSuppression()`** : envoie la suppression qui était en attente. Si le serveur refuse, la tâche revient à l'écran.
- **`annulerSuppression()`** : bouton « Annuler » : arrête le minuteur et remet la tâche.
- **`fermerNotification()`** : bouton croix : valide la suppression en attente s'il y en a une, sinon cache simplement la notification.
- **`effacerFiltres()`** : vide la recherche et le filtre d'étiquette.
- **`texteAucunResultat()`** : la phrase affichée quand les filtres ne laissent aucune tâche.
- **`afficherContenu()`** : choisit ce qui s'affiche sous le formulaire : chargement, erreur, liste vide, aucun résultat, matrice ou tableau à trois colonnes.
- **`texteNombreTaches()`** : sous-titre de l'en-tête, par exemple « 5 tâches » ou « 2 sur 5 tâches » quand un filtre est actif.

Deux `useEffect` en plus :

- l'un écoute l'événement `pagehide` (fermeture de l'onglet) pour envoyer quand même une suppression en attente ;
- l'autre cache automatiquement les notifications sans bouton « Annuler » au bout de 5 secondes.

Calculs faits à chaque affichage : la liste des étiquettes (`toutesLesEtiquettes`), le filtre réellement actif (si l'étiquette choisie n'existe plus, il est ignoré) et `tachesAffichees`, c'est-à-dire les tâches filtrées par titre, puis par étiquette, puis triées.

### Composants

Tous les composants sont dans `client/src/components/`. Les « props » sont les valeurs que le composant reçoit de son parent. Par habitude, les props qui commencent par `on` sont des fonctions appelées quand il se passe quelque chose.

#### FormulaireAjout

- **Ce qu'il affiche** : le formulaire d'ajout en haut de la page : titre, description, priorité, échéance et étiquettes (séparées par des virgules).
- **Props** : `onAjout(tache)`, appelée avec la tâche créée par le serveur.
- **Comportement** :
  - Entrée envoie le formulaire, même depuis la description (Maj + Entrée fait un retour à la ligne) ;
  - les touches `/` ou `N`, n'importe où dans la page, placent le curseur dans le titre (sauf si on est déjà en train d'écrire) ;
  - après l'ajout, le formulaire se vide et le curseur reste dans le titre pour enchaîner ;
  - titre vide ou erreur du serveur : un message s'affiche sous les champs.
- **Fonctions internes** : `envoyer(evenement)` (vérifie puis appelle `ajouterTache`), `toucheDescription(evenement)` (gère Entrée dans la description), et une fonction `gererTouche` dans le `useEffect` pour le raccourci clavier.
- **Utilisé dans** : `App`.

#### BarreRecherche

- **Ce qu'il affiche** : le champ de recherche par titre et la liste déroulante du tri.
- **Props** : `recherche` et `onRecherche(texte)`, `tri` et `onTri(valeur)`.
- **Comportement** : Échap ou la petite croix vident la recherche. Le composant ne filtre rien lui-même : il renvoie seulement les valeurs choisies à `App`.
- **Utilisé dans** : `App`.

#### FiltreEtiquettes

- **Ce qu'il affiche** : une rangée de pastilles « Toutes », puis une par étiquette existante.
- **Props** : `etiquettes` (liste sans doublon), `etiquetteChoisie`, `onChoisir(etiquette)`.
- **Comportement** : un second clic sur la pastille choisie enlève le filtre. N'affiche rien s'il n'y a aucune étiquette.
- **Utilisé dans** : `App`.

#### ChoixVue

- **Ce qu'il affiche** : deux boutons « Tableau » et « Matrice » dans l'en-tête.
- **Props** : `vue` (la vue actuelle), `onChoisir(vue)`.
- **Utilisé dans** : `App` (seulement quand il y a des tâches).

#### ChoixTheme

- **Ce qu'il affiche** : un bouton rond dans l'en-tête, avec une icône écran, soleil ou lune selon le thème.
- **Props** : aucune.
- **Comportement** : chaque clic passe au thème suivant (`themeSuivant`) et l'applique (`appliquerTheme`). Le texte lu par les lecteurs d'écran indique le thème actuel et le suivant.
- **Utilisé dans** : `App`.

#### PanneauStatistiques

- **Ce qu'il affiche** : un panneau repliable (balise `<details>`) avec :
  - un petit graphique en barres des tâches finies les 7 derniers jours ;
  - le nombre de tâches de chaque status et une barre découpée selon leur part.
- **Props** : `taches`, toutes les tâches (les filtres ne sont pas pris en compte).
- **Fonction interne** : `pluriel(nombre, mot)` ajoute un « s » quand il le faut.
- **Utilisé dans** : `App`.

#### ColonneStatut

- **Ce qu'il affiche** : une colonne du tableau : un point de couleur, le nom du status, le nombre de tâches, puis les cartes (ou « Aucune tâche ici »).
- **Props** :
  - `statut` : un élément de `STATUTS` ;
  - `taches` : seulement les tâches de ce status ;
  - `tacheGlissee` : la tâche en train d'être glissée, ou `null` ;
  - `onDeposer(id, status)` : appelée quand une carte est lâchée dans la colonne ;
  - `onSupprimer`, `onChangerStatus`, `onModifier`, `onDebutGlisser`, `onFinGlisser`, `onMiseAJour`, `onFiltrerEtiquette` : transmises telles quelles aux cartes.
- **Fonctions internes (glisser-déposer HTML5)** :
  - `gererSurvol` : autorise le dépôt (`preventDefault()`) seulement si la carte vient d'une autre colonne, et éclaire la colonne ;
  - `gererSortie` : enlève la surbrillance quand la souris sort vraiment de la colonne (et pas seulement d'une carte à l'autre) ;
  - `gererDepot` : lit l'id de la tâche dans `dataTransfer` et appelle `onDeposer`.
- **Utilisé dans** : `App` (trois fois, une par status).

#### MatriceEisenhower

- **Ce qu'il affiche** : la deuxième vue, quatre cases (urgent / important) avec les cartes de chaque case, et une note sur les tâches finies, qui ne sont pas rangées dans la matrice.
- **Props** : `taches` (déjà filtrées et triées par `App`), `onSupprimer`, `onChangerStatus`, `onModifier`, `onMiseAJour`, `onFiltrerEtiquette`.
- **Comportement** : utilise `quadrantDeLaTache` pour ranger chaque tâche. Les cartes ne sont pas déplaçables ici (`deplacable={false}`) : pour changer une tâche de case, on modifie sa priorité ou son échéance.
- **Utilisé dans** : `App`, quand `vue` vaut `'matrice'`.

#### CarteTache

- **Ce qu'il affiche** : une tâche : titre, description, badge de priorité, badge d'échéance (rouge et « en retard » si besoin), étiquettes, sous-tâches, date de création et boutons d'action (flèches gauche et droite, historique, modifier, supprimer).
- **Props** :
  - `tache` : la tâche à afficher ;
  - `deplacable` : `false` pour une carte qu'on ne peut pas glisser (`true` par défaut) ;
  - `onSupprimer(tache)` : corbeille ;
  - `onChangerStatus(tache, status)` : flèches ;
  - `onModifier(tache, modifications)` : enregistrement du mode édition, doit renvoyer une promesse ;
  - `onDebutGlisser(tache)` et `onFinGlisser()` : début et fin du glisser-déposer ;
  - `onMiseAJour(tache)` : nouvelle version de la tâche (sous-tâches, étiquettes) ;
  - `onFiltrerEtiquette(etiquette)` : clic sur le nom d'une étiquette.
- **Fonctions** :
  - `formaterDate(date)` (en dehors du composant) : date courte, par exemple « 16 nov. 2026 » ;
  - `formaterEcheance(echeance)` (en dehors du composant) : « Aujourd'hui » ou la date courte, lue en UTC ;
  - `ouvrirEdition()` : passe la carte en mode édition en repartant des valeurs actuelles ;
  - `fermerEdition()` : quitte le mode édition ;
  - `enregistrer(evenement)` : vérifie le titre puis appelle `onModifier` ; affiche l'erreur du serveur si besoin ;
  - `gererTouche(evenement)` : Échap annule, Entrée enregistre (Maj + Entrée fait un retour à la ligne dans la description) ;
  - `commencerGlisser(evenement)` : range l'id de la tâche dans `dataTransfer` et prévient le tableau ;
  - `terminerGlisser()` : remet la carte dans son état normal.
- **Détails** :
  - en mode édition, la carte devient un petit formulaire (titre, description, priorité, échéance) ;
  - en sortant du mode édition, le focus revient sur le bouton crayon pour ne pas perdre sa place au clavier ;
  - pendant qu'on écrit une sous-tâche ou une étiquette, la carte n'est plus déplaçable, sinon le navigateur confond la sélection du texte avec un glisser-déposer ;
  - les flèches restent disponibles pour le clavier et les lecteurs d'écran, en plus du glisser-déposer.
- **Utilisé dans** : `ColonneStatut` et `MatriceEisenhower`.

#### SousTaches

- **Ce qu'il affiche** : dans une carte, la barre de progression (par exemple 2/3), la liste des sous-tâches avec leur case à cocher et une croix, et un bouton « Sous-tâche » qui ouvre un petit champ d'ajout.
- **Props** : `tache`, `onMiseAJour(tache)`, `onSaisie(ouvert)` (prévient la carte quand le champ s'ouvre ou se ferme).
- **Fonctions internes** :
  - `ouvrirAjout()` et `fermerAjout()` : ouvrent et ferment le champ (Échap ferme aussi) ;
  - `ajouter(evenement)` : envoie la nouvelle sous-tâche, vide le champ et le laisse ouvert pour enchaîner ;
  - `basculer(sousTache)` : coche ou décoche tout de suite à l'écran, puis prévient le serveur ; en cas d'échec, l'ancienne version revient ;
  - `supprimer(sousTache)` : supprime la sous-tâche.
- **Utilisé dans** : `CarteTache`.

#### Etiquettes

- **Ce qu'il affiche** : dans une carte, une pastille de couleur par étiquette (le nom filtre le tableau, la croix l'enlève) et un bouton « Étiquette » pour en ajouter une.
- **Props** : `tache`, `onMiseAJour(tache)`, `onSaisie(ouvert)`, `onFiltrer(etiquette)`.
- **Fonctions internes** :
  - `ouvrirAjout()` et `fermerAjout()` ;
  - `envoyerListe(nouvelleListe)` : envoie la liste complète au serveur avec `modifierTache` ;
  - `ajouter(evenement)` : nettoie le texte, ignore une étiquette déjà présente, sinon l'envoie ;
  - `enlever(etiquette)` : retire l'étiquette tout de suite à l'écran ; en cas d'échec, l'ancienne version revient.
- **Utilisé dans** : `CarteTache`.

#### Historique

- **Ce qu'il affiche** : la liste des actions faites sur la tâche, de la plus récente à la plus ancienne, avec une icône, une phrase et la date et l'heure.
- **Props** : `tache`, `id` (identifiant HTML, relié au bouton qui ouvre l'historique par `aria-controls`).
- **Fonctions** (en dehors du composant) :
  - `formaterMoment(date)` : par exemple « 20 nov. 2026 à 14:32 » ;
  - `decrireAction(ligne)` : renvoie l'icône et la phrase d'une ligne (« Tâche créée », « Statut : ... », « Modifiée : ... »).
- **Détail** : une tâche créée avant l'ajout de l'historique n'a aucune ligne ; on affiche alors au moins sa création, avec sa date de création.
- **Utilisé dans** : `CarteTache`, quand on clique sur le bouton horloge.

#### Notification

- **Ce qu'il affiche** : un petit bandeau en bas de l'écran avec un message, un bouton « Annuler » facultatif, une croix, et une barre qui se vide pendant la durée de la notification.
- **Props** : `message`, `duree` (en ms, pour l'animation de la barre), `onAnnuler` (ou `null` pour ne pas afficher le bouton), `onFermer`.
- **Utilisé dans** : `App`. La prop `key` change à chaque nouvelle notification, ce qui relance l'animation de la barre.

### Styles

- **`client/src/index.css`** : les variables CSS (couleurs, ombres, arrondis, espacements, polices) dans `:root`, et leur version sombre. Le thème sombre s'applique si le système est en mode sombre et que l'utilisateur n'a pas forcé le clair, ou si l'utilisateur a choisi le sombre (`data-theme="sombre"` sur `<html>`). On y trouve aussi les styles de base de la page et la classe `.visuellement-cache` (texte lu seulement par les lecteurs d'écran).
- **`client/src/App.css`** : les styles de tous les composants (en-tête, formulaire, colonnes, cartes, matrice, statistiques, notification...), la classe `.cache` (même rôle que `.visuellement-cache`), les couleurs des étiquettes et la mise en page pour mobile (`@media (max-width: ...)`).

Pour changer la couleur principale de l'interface, il suffit de modifier `--accent` (et ses variantes `--accent-fonce` et `--accent-clair`) dans `index.css`, pour le thème clair et pour le thème sombre.
