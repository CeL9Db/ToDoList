const express = require('express')
const { listerTaches, creerTache } = require('../controllers/todoController')

const router = express.Router()

// Toutes ces routes commencent par /api/todos (voir server.js)
router.get('/', listerTaches)
router.post('/', creerTache)

module.exports = router
