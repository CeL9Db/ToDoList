const express = require('express')
const {
    listerTaches,
    creerTache,
    modifierTache,
    supprimerTache,
    ajouterSousTache,
    modifierSousTache,
    supprimerSousTache
} = require('../controllers/todoController')

const router = express.Router()

// Toutes ces routes commencent par /api/todos (voir server.js)
router.get('/', listerTaches)
router.post('/', creerTache)
router.put('/:id', modifierTache)
router.delete('/:id', supprimerTache)

// Sous-tâches d'une tâche : chaque route renvoie la tâche complète mise à jour
router.post('/:id/sous-taches', ajouterSousTache)
router.put('/:id/sous-taches/:idSousTache', modifierSousTache)
router.delete('/:id/sous-taches/:idSousTache', supprimerSousTache)

module.exports = router
