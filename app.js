const {errorHandler, endpointTypo} = require('./middleware/errorHandler')
const config = require('./utils/config')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()

const loginRouter = require('./controllers/login')
const blackListMiddleware = require('./middleware/blackList')
const tokenMiddleware = require('./middleware/tokenAuth')
const userRouter = require('./controllers/users')
const filterRouter = require('./controllers/filterData')
const dependencyRouter = require('./controllers/dependencies')
const excelRouter = require('./controllers/excel') // Aquí se craftea el excel!

mongoose.set('strictQuery', false)

// Conexión a la base de datos:
mongoose.connect(config.MONGO_URI)
    .then(() => {
        console.log('Conectado a la base de datos! 🌿 🌳')
    })
    .catch(error => console.error('Error al conectarse a la db.', error))

const corsOptions = {
    origin: ['https://tabla-de-datos-rlqbwiyb4-joelfaldins-projects.vercel.app', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false
}

app.use(cors(corsOptions))
// app.use(express.static('dist'))
app.use(express.json())

// Routers:
app.use('', loginRouter)

app.use('', blackListMiddleware)
app.use('', tokenMiddleware)

app.use('', userRouter, blackListMiddleware)
app.use('', filterRouter, blackListMiddleware)
app.use('', dependencyRouter, blackListMiddleware)
app.use('', excelRouter, blackListMiddleware)

// Error handlers:
app.use(errorHandler)
app.use(endpointTypo)

module.exports = app