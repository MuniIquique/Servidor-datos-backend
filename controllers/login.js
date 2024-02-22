const jwt = require('jsonwebtoken')
const loginRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const blackList = require('../models/blackList')
const recoverPassword = require('../models/recoverPassword')
const newEmail = require('../utils/email')

// Endpoint de prueba:
loginRouter.get('/api/test', (req, res) => {
    res.json({ message: "hello world" })
})

// Verificación del login:
loginRouter.post('/api/verifyLogin/', async (req, res) => {
    const { rut, password } = req.body
    
    const user = await User.findOne({ rut })
    const goodPassword = user === null
        ? false
        : await bcrypt.compare(password, user.passHash)

    if (user === null) {
        return res.status(404).json({ rut: 'Rut incorrecto, ingrese uno nuevo...' })
    } else if (!goodPassword) {
        return res.status(401).json({ password: 'Contraseña incorrecta.' })
    }

    const userToken = {
        nombres: user.nombres,
        rut: user.rut
    }

    const token = jwt.sign(userToken, process.env.SECRET)

    res.status(200).send({ message: 'Verificación exitosa!', token, nombres: user.nombres, rut: user.rut, access: user.rol })
})

// Ruta para recuperar la contraseña (sin usar):
loginRouter.post('/api/getPassword', async (req, res) => {
    const { rut, email } = req.body
    
    try {
        const user = await User.findOne({ rut: rut })
    
        if (user && user.email === email) {
            const expiration = '5m'
            const token = jwt.sign({ rut }, process.env.SECRET, { expiresIn: expiration })

            recoverPassword.create({ rut, token })
            const link = `${req.protocol}://192.168.1.100:5173/newPassword?token=${token}`
            const subject = 'Cambio de contraseña'
            const text = `Haga click aquí para cambiar la contraseña: ${link}`
            
            newEmail(user.email, subject, text)

            res.status(200).json({ message: 'Credenciales correctas. Revise su correo.' })
            return
        } else if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado.' })
        } else if (user.email !== email) {
            res.status(401).json({ error: 'Correo incorrecto!' })
        }
        return
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.', error })
        return
    }
})

// Revisando el token del componente NewPassword:
loginRouter.post('/api/verifyToken', async (req, res) => {
    const { token } = req.body
    
    try {
        jwt.verify(token, process.env.SECRET)
        res.status(200).json({ valid: true })
    } catch(error) {
        res.status(401).json({ valid: false, error: 'Token inválido.' })
    }
})

// Actualizando la contraseña:
loginRouter.patch('/api/restorePassword', async (req, res) => {
    const { newPassword, token } = req.body

    try {
        const decode = jwt.verify(token, process.env.SECRET)
        const user = await User.findOne({ rut: decode.rut })

        if (user) {
            const salt = 10
            const hash = await bcrypt.hash(newPassword, salt)
    
            await User.findByIdAndUpdate(user._id, { passHash: hash })
            res.status(200).json({ message: 'Contraseña actualizada!' })
        } else {
            res.status(404).json({ error: 'Usuario no encontrado.' })
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token expirado.' })
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Token inválido.' })
        } else {
            res.status(500).json({ error: 'Error interno del servidor.' })
        }
    }
})

// Proceso de logout:
loginRouter.post('/api/logout', async (req, res) => {
    const token = req.get('authorization')?.replace('Bearer ', '')

    if (token) {
        try {
            await blackList.create({ token })
            return res.status(200).json({ message: 'Sesión cerrada con éxito!' })
        } catch(error) {
            return res.status(500).json({ error: 'Hubo un error al cerrar sesión.' })
        }
    }

    return res.status(401).json({ error: 'Token inexistente' })
})


module.exports = loginRouter