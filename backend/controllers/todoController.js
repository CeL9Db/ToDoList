const Donnee = require('../model/donnee')

// Les seules valeurs acceptées pour le champ status (les mêmes que dans le modèle)
const STATUS_AUTORISES = Donnee.schema.path('status').enumValues

// Renvoie toutes les tâches, de la plus récente à la plus ancienne
async function listerTaches(req, res) {
    try {
        const taches = await Donnee.find().sort({ date: -1 })
        res.json(taches)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la récupération des tâches.' })
    }
}

// Crée une nouvelle tâche à partir du titre, de la description et du status reçus
async function creerTache(req, res) {
    // req.body peut être absent si la requête n'envoie pas de JSON
    const { titre, desc, status } = req.body || {}

    // Le titre est obligatoire et ne doit pas être vide
    if (typeof titre !== 'string' || titre.trim() === '') {
        return res.status(400).json({ message: 'Le titre est obligatoire.' })
    }

    // Le status est facultatif, mais s'il est donné il doit être dans la liste
    if (status !== undefined && !STATUS_AUTORISES.includes(status)) {
        return res.status(400).json({ message: 'Le status est invalide.' })
    }

    try {
        const tache = await Donnee.create({ titre: titre.trim(), desc, status })
        res.status(201).json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la création de la tâche.' })
    }
}

module.exports = { listerTaches, creerTache }
