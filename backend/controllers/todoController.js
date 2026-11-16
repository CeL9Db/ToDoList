const mongoose = require('mongoose')
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

// Modifie une tâche existante : seuls les champs envoyés (titre, desc, status) changent
async function modifierTache(req, res) {
    const { id } = req.params
    const { titre, desc, status } = req.body || {}

    // Un id mal formé ne peut correspondre à aucune tâche
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: 'Tâche introuvable.' })
    }

    // Si le titre est envoyé, il ne doit pas être vide
    if (titre !== undefined && (typeof titre !== 'string' || titre.trim() === '')) {
        return res.status(400).json({ message: 'Le titre est obligatoire.' })
    }

    if (status !== undefined && !STATUS_AUTORISES.includes(status)) {
        return res.status(400).json({ message: 'Le status est invalide.' })
    }

    // On ne garde que les champs réellement envoyés
    const modifications = {}
    if (titre !== undefined) modifications.titre = titre.trim()
    if (desc !== undefined) modifications.desc = desc
    if (status !== undefined) modifications.status = status

    try {
        // new: true renvoie la tâche après modification
        const tache = await Donnee.findByIdAndUpdate(id, modifications, { new: true, runValidators: true })

        if (!tache) {
            return res.status(404).json({ message: 'Tâche introuvable.' })
        }

        res.json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la modification de la tâche.' })
    }
}

// Supprime une tâche et renvoie la tâche supprimée
async function supprimerTache(req, res) {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: 'Tâche introuvable.' })
    }

    try {
        const tache = await Donnee.findByIdAndDelete(id)

        if (!tache) {
            return res.status(404).json({ message: 'Tâche introuvable.' })
        }

        res.json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la suppression de la tâche.' })
    }
}

module.exports = { listerTaches, creerTache, modifierTache, supprimerTache }
