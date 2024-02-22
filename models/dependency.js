const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

// Modelo de una dependencia:
const dependencySchema = mongoose.Schema ({
    nombre: {
        required: true,
        type: String
    },
    direccion: {
        required: true,
        type: String
    },
})

dependencySchema.set('toJSON', {
    transform: (document, returned) => {
            delete returned._id
    }
})

module.exports = mongoose.model('Dependency', dependencySchema)