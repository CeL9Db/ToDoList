const mongoose = require('mongoose')
const Donnee = require('../model/donnee')

// Les seules valeurs acceptées pour le champ status (les mêmes que dans le modèle)
const STATUS_AUTORISES = Donnee.schema.path('status').enumValues
const PRIORITES_AUTORISEES = Donnee.schema.path('priorite').enumValues
// Le status qui veut dire que la tâche est terminée
const STATUS_FINI = 'Fini avec succès !'

// Vérifie l'échéance reçue : null ou '' pour l'enlever, sinon une date valide
// Renvoie la valeur à enregistrer, ou undefined si la date est invalide
function lireEcheance(echeance) {
    if (echeance === null || echeance === '') return null
    const date = new Date(echeance)
    if (typeof echeance !== 'string' || isNaN(date.getTime())) return undefined
    return date
}

// Nombre maximum de lignes gardées dans l'historique d'une tâche (les plus anciennes partent)
const MAX_HISTORIQUE = 50

// Noms des champs tels qu'ils sont affichés dans l'historique
const NOMS_CHAMPS = {
    titre: 'titre',
    desc: 'description',
    priorite: 'priorité',
    echeance: 'échéance',
    etiquettes: 'étiquettes'
}

// Transforme une valeur en texte pour pouvoir comparer l'ancienne et la nouvelle
// (une date devient un nombre, un tableau devient "a,b", rien devient '')
function enTexte(valeur) {
    if (valeur === null || valeur === undefined) return ''
    if (valeur instanceof Date) return String(valeur.getTime())
    if (Array.isArray(valeur)) return valeur.join(',')
    return String(valeur)
}

// Compare l'ancienne tâche et les modifications demandées
// Renvoie les lignes à ajouter à l'historique (tableau vide si rien n'a vraiment changé)
function actionsHistorique(ancienne, modifications) {
    const actions = []
    const maintenant = new Date()

    if (modifications.status !== undefined && modifications.status !== ancienne.status) {
        actions.push({ action: 'status', detail: `${ancienne.status} → ${modifications.status}`, date: maintenant })
    }

    // Liste des champs qui ont réellement changé, par exemple ['titre', 'priorité']
    const champsModifies = Object.keys(NOMS_CHAMPS)
        .filter((champ) => modifications[champ] !== undefined)
        .filter((champ) => enTexte(modifications[champ]) !== enTexte(ancienne[champ]))
        .map((champ) => NOMS_CHAMPS[champ])

    if (champsModifies.length > 0) {
        actions.push({ action: 'modification', detail: champsModifies.join(', '), date: maintenant })
    }

    return actions
}

// Limites des étiquettes : nombre maximum par tâche et longueur maximum d'une étiquette
const MAX_ETIQUETTES = 10
const LONGUEUR_MAX_ETIQUETTE = 30

// Vérifie les étiquettes reçues : il faut un tableau de textes
// Les espaces autour sont enlevés, tout passe en minuscules et les doublons sont retirés
// Renvoie le tableau nettoyé, ou un texte d'erreur si quelque chose ne va pas
function lireEtiquettes(etiquettes) {
    if (!Array.isArray(etiquettes) || etiquettes.some((e) => typeof e !== 'string')) {
        return 'Les étiquettes doivent être une liste de textes.'
    }

    const propres = []
    for (const etiquette of etiquettes) {
        const texte = etiquette.trim().toLowerCase()
        if (texte === '') continue
        if (texte.length > LONGUEUR_MAX_ETIQUETTE) {
            return `Une étiquette ne peut pas dépasser ${LONGUEUR_MAX_ETIQUETTE} caractères.`
        }
        if (!propres.includes(texte)) propres.push(texte)
    }

    if (propres.length > MAX_ETIQUETTES) {
        return `Une tâche ne peut pas avoir plus de ${MAX_ETIQUETTES} étiquettes.`
    }
    return propres
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

// Crée une nouvelle tâche à partir du titre, de la description, du status, de la priorité,
// de l'échéance et des étiquettes reçus
async function creerTache(req, res) {
    // req.body peut être absent si la requête n'envoie pas de JSON
    const { titre, desc, status, priorite, echeance, etiquettes } = req.body || {}

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

    // Les étiquettes sont facultatives (liste vide par défaut)
    let listeEtiquettes = []
    if (etiquettes !== undefined) {
        listeEtiquettes = lireEtiquettes(etiquettes)
        if (typeof listeEtiquettes === 'string') {
            return res.status(400).json({ message: listeEtiquettes })
        }
    }

    try {
        const tache = await Donnee.create({
            titre: titre.trim(),
            desc,
            status,
            priorite,
            echeance: dateEcheance,
            etiquettes: listeEtiquettes,
            // Une tâche créée directement comme finie reçoit tout de suite sa date de fin
            dateFin: status === STATUS_FINI ? new Date() : null,
            // Première ligne de l'historique
            historique: [{ action: 'creation' }]
        })
        res.status(201).json(tache)
    } catch (erreur) {
        console.error(erreur.message)
        res.status(500).json({ message: 'Erreur lors de la création de la tâche.' })
    }
}

// Modifie une tâche existante : seuls les champs envoyés (titre, desc, status, priorite, echeance, etiquettes) changent
async function modifierTache(req, res) {
    const { id } = req.params
    const { titre, desc, status, priorite, echeance, etiquettes } = req.body || {}

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
    // On envoie toujours la liste complète des étiquettes (après un ajout ou une suppression)
    if (etiquettes !== undefined) {
        modifications.etiquettes = lireEtiquettes(etiquettes)
        if (typeof modifications.etiquettes === 'string') {
            return res.status(400).json({ message: modifications.etiquettes })
        }
    }

    try {
        // On a besoin de l'ancienne version de la tâche pour la date de fin et pour l'historique
        const ancienne = await Donnee.findById(id)
        if (!ancienne) {
            return res.status(404).json({ message: 'Tâche introuvable.' })
        }

        // Date de fin : posée quand la tâche devient finie, enlevée si elle repart dans une autre colonne
        // (une tâche déjà finie garde sa date)
        if (status !== undefined) {
            if (status === STATUS_FINI && ancienne.status !== STATUS_FINI) {
                modifications.dateFin = new Date()
            } else if (status !== STATUS_FINI) {
                modifications.dateFin = null
            }
        }

        // $set change les champs, $push ajoute les nouvelles lignes à la fin de l'historique
        // $slice garde seulement les MAX_HISTORIQUE dernières lignes
        const miseAJour = { $set: modifications }
        const actions = actionsHistorique(ancienne, modifications)
        if (actions.length > 0) {
            miseAJour.$push = { historique: { $each: actions, $slice: -MAX_HISTORIQUE } }
        }

        // new: true renvoie la tâche après modification
        const tache = await Donnee.findByIdAndUpdate(id, miseAJour, { new: true, runValidators: true })

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
