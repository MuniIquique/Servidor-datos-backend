const express = require('express')
const app = require('./app')
const cors = require('cors')
const mongoose = require('mongoose')
const config = require('./utils/config')
const User = require('./models/user')
const bcrypt = require('bcrypt')

app.use(express.json)
app.use(cors())

mongoose.set('strictQuery', false)

// Añadir un usuario:
// const asyncFunction = async() => {
//     const salt = 10
//     const hash = await bcrypt.hash('newestAdming2374', salt)
    
//     const user = new User({
//         rut: '11.111.111-1',
//         nombres: 'SuperAdmin',
//         apellidos: 'admin',
//         email: 'firstadmin@gmail.com',
//         passHash: hash,
//         rol: 'superAdmin',
//         dependencias: 'Municipalidad norte',
//         direcciones: 'Iquique',
//         numMunicipal: '56 9 1000 0002',
//         anexoMunicipal: '572514376'
//     })
    
//     user.save().then(() => {
//         console.log('Usuario agregado!')
//         mongoose.connection.close()
//     })
// }

// asyncFunction()

// User.find({}).then(res => console.log(res))

const port = config.PORT
app.listen(port, '0.0.0.0', () => {
    console.log('Server iniciado!')
    console.log(`http://localhost:${port}`)
})