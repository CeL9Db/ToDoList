const mongoose = require('mongoose')

// Une sous-tâche : un petit texte et une case cochée ou non
// Mongoose lui donne automatiquement un _id, ce qui permet de la retrouver
const sousTache = new mongoose.Schema(
    {
        texte: {type: String, required: true, trim: true},
        fait: {type: Boolean, default: false}
    }
)

const donnee = new mongoose.Schema(
    {
        titre : {type: String, required: true},
        status : {type: String, default: 'List', enum: ['List', 'En train de réflechir', 'Fini avec succès !']},
        desc: String,
        date: {type: Date, default: Date.now},
        // Importance de la tâche
        priorite: {type: String, default: 'moyenne', enum: ['basse', 'moyenne', 'haute']},
        // Date limite facultative (null = pas d'échéance)
        echeance: {type: Date, default: null},
        // Les sous-tâches sont rangées directement dans le document de la tâche
        sousTaches: {type: [sousTache], default: []}
    }
)

module.exports = mongoose.model('Todo_obj', donnee)
