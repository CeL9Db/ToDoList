const mongoose = require('mongoose')

const donnee = new mongoose.Schema(
    {
        titre : {type: String, required: true},
        status : {type: String, default: 'List', enum: ['List', 'En train de réflechir', 'Fini avec succès !']},
        desc: String,
        date: {type: Date, default: Date.now}
    }
)

module.exports = mongoose.model('Todo_obj', donnee)