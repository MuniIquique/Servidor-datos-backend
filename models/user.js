const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const bcrypt = require('bcrypt')

// Modelo de un usuario:
const userSchema = mongoose.Schema({
    rut: {
        type: String,
        required: true
    },
    nombres: {
        type: String,
        required: true
    },
    apellidos: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    passHash: {
        type: String,
    },
    rol: String || 'user',
    dependencias: {
        type: String,
        required: true
    },
    direcciones: {
        type: String,
        required: true
    },
    numMunicipal: {
        type: String,
        required: true
    },
    anexoMunicipal: {
        type: String,
        required: true
    },
})

userSchema.methods.verifyPass = (password) => {
    return bcrypt.compare(password, this.passHash)
}

userSchema.set('toJSON', {
    transform: (document, returned) => {
        delete returned._id
        delete returned.__v
        delete returned.passHash
    }
})

module.exports = mongoose.model('User', userSchema)