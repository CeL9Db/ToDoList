const express = require('express')
const { listerTaches, creerTache, modifierTache, supprimerTache } = require('../controllers/todoController')

const router = express.Router()

// Toutes ces routes commencent par /api/todos (voir server.js)
router.get('/', listerTaches)
router.post('/', creerTache)
router.put('/:id', modifierTache)
router.delete('/:id', supprimerTache)

module.exports = router
