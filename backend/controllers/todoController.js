const mongoose = require('mongoose')
const Donnee = require('../model/donnee')

// Les seules valeurs acceptées pour le champ status (les mêmes que dans le modèle)
const STATUS_AUTORISES = Donnee.schema.path('status').enumValues
const PRIORITES_AUTORISEES = Donnee.schema.path('priorite').enumValues

// Vérifie l'échéance reçue : null ou '' pour l'enlever, sinon une date valide
// Renvoie la valeur à enregistrer, ou undefined si la date est invalide
function lireEcheance(echeance) {
    if (echeance === null || echeance === '') return null
    const date = new Date(echeance)
    if (typeof echeance !== 'string' || isNaN(date.getTime())) return undefined
    return date
}

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

// Crée une nouvelle tâche à partir du titre, de la description, du status, de la priorité et de l'échéance reçus
async function creerTache(req, res) {
    // req.body peut être absent si la requête n'envoie pas de JSON
    const { titre, desc, status, priorite, echeance } = req.body || {}

    // Le titre est obligatoire et ne doit pas être vide
    if (typeof titre !== 'string' || titre.trim() === '') {
        return res.status(400).json({ message: 'Le titre est obligatoire.' })
    }

    // Le status est facultatif, mais s'il est donné il doit être dans la liste
    if (status !== undefined && !STATUS_AUTORISES.includes(status)) {
        return res.status(400).json({ message: 'Le status est invalide.' })
    }

    if (priorite !== undefined && !PRIORITES_AUTORISEES.includes(priorite)) {
        return res.status(400).json({ message: 'La priorité doit être basse, moyenne ou haute.' })
    }

    // L'échéance est facultative
    let dateEcheance = null
    if (echeance !== undefined) {
        dateEcheance = lireEcheance(echeance)
        if (dateEcheance === undefined) {
            return res.status(400).json({ message: "La date d'échéance est invalide." })
        }
    }

    try {
        const tache = await Donnee.create({ titre: titre.trim(), desc, status, priorite, echeance: dateEcheance })
        res.status(201).json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la création de la tâche.' })
    }
}

// Modifie une tâche existante : seuls les champs envoyés (titre, desc, status, priorite, echeance) changent
async function modifierTache(req, res) {
    const { id } = req.params
    const { titre, desc, status, priorite, echeance } = req.body || {}

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

    if (priorite !== undefined && !PRIORITES_AUTORISEES.includes(priorite)) {
        return res.status(400).json({ message: 'La priorité doit être basse, moyenne ou haute.' })
    }

    // On ne garde que les champs réellement envoyés
    const modifications = {}
    if (titre !== undefined) modifications.titre = titre.trim()
    if (desc !== undefined) modifications.desc = desc
    if (status !== undefined) modifications.status = status
    if (priorite !== undefined) modifications.priorite = priorite
    if (echeance !== undefined) {
        modifications.echeance = lireEcheance(echeance)
        if (modifications.echeance === undefined) {
            return res.status(400).json({ message: "La date d'échéance est invalide." })
        }
    }

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

// Retrouve la tâche de l'URL (req.params.id), ou répond 404 et renvoie null
async function trouverTache(req, res) {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ message: 'Tâche introuvable.' })
        return null
    }

    const tache = await Donnee.findById(id)
    if (!tache) {
        res.status(404).json({ message: 'Tâche introuvable.' })
        return null
    }

    return tache
}

// Retrouve une sous-tâche de la tâche grâce à req.params.idSousTache, ou répond 404 et renvoie null
function trouverSousTache(tache, req, res) {
    const { idSousTache } = req.params
    const sousTache = mongoose.isValidObjectId(idSousTache) ? tache.sousTaches.id(idSousTache) : null

    if (!sousTache) {
        res.status(404).json({ message: 'Sous-tâche introuvable.' })
        return null
    }

    return sousTache
}

// Ajoute une sous-tâche (non cochée) à la fin de la liste et renvoie la tâche complète
async function ajouterSousTache(req, res) {
    const { texte } = req.body || {}

    if (typeof texte !== 'string' || texte.trim() === '') {
        return res.status(400).json({ message: 'Le texte de la sous-tâche est obligatoire.' })
    }

    try {
        const tache = await trouverTache(req, res)
        if (!tache) return

        tache.sousTaches.push({ texte: texte.trim() })
        await tache.save()
        res.status(201).json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: "Erreur lors de l'ajout de la sous-tâche." })
    }
}

// Modifie une sous-tâche : la cocher / décocher (fait) ou changer son texte
// Renvoie la tâche complète
async function modifierSousTache(req, res) {
    const { texte, fait } = req.body || {}

    if (texte !== undefined && (typeof texte !== 'string' || texte.trim() === '')) {
        return res.status(400).json({ message: 'Le texte de la sous-tâche est obligatoire.' })
    }

    if (fait !== undefined && typeof fait !== 'boolean') {
        return res.status(400).json({ message: 'Le champ fait doit être true ou false.' })
    }

    try {
        const tache = await trouverTache(req, res)
        if (!tache) return

        const sousTache = trouverSousTache(tache, req, res)
        if (!sousTache) return

        if (texte !== undefined) sousTache.texte = texte.trim()
        if (fait !== undefined) sousTache.fait = fait
        await tache.save()
        res.json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la modification de la sous-tâche.' })
    }
}

// Supprime une sous-tâche et renvoie la tâche complète
async function supprimerSousTache(req, res) {
    try {
        const tache = await trouverTache(req, res)
        if (!tache) return

        const sousTache = trouverSousTache(tache, req, res)
        if (!sousTache) return

        sousTache.deleteOne()
        await tache.save()
        res.json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la suppression de la sous-tâche.' })
    }
}

module.exports = {
    listerTaches,
    creerTache,
    modifierTache,
    supprimerTache,
    ajouterSousTache,
    modifierSousTache,
    supprimerSousTache
}
