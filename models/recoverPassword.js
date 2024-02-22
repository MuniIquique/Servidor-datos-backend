const mongoose = require('mongoose')

// Modelo para guardar un token con el rut:
const recoverPasswordSchema = mongoose.Schema({
    rut: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('RecoverPassword', recoverPasswordSchema)