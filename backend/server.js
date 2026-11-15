// Charge les variables du fichier .env (MONGO_URI, PORT)
require('dotenv').config({ quiet: true })

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const todoRoutes = require('./routes/todoRoutes')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todolist'

// Autorise les requêtes du client React et lit le JSON des requêtes
app.use(cors())
app.use(express.json())

// Toutes les routes des tâches sont dans backend/routes/todoRoutes.js
app.use('/api/todos', todoRoutes)

// Connexion à la base MongoDB locale, puis démarrage du serveur
async function demarrer() {
    try {
        // On n'attend pas plus de 5 secondes si MongoDB ne répond pas
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
        console.log(`Connecté à MongoDB : ${MONGO_URI}`)

        app.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`)
        })
    } catch (erreur) {
        console.error('Impossible de se connecter à MongoDB.')
        console.error('Vérifiez que MongoDB est bien lancé et que MONGO_URI est correct dans le fichier .env.')
        console.error(`Détail : ${erreur.message}`)
        process.exit(1)
    }
}

demarrer()
