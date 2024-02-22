const userRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const getToken = res => {
    const authorization = res.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '') 
    }
    return null
}

// Obtener la data para la tabla (también maneja valores de búsqueda):
userRouter.get('/api/newData/', async (req, res) => {
    const { searchValue, searchColumn, page, pageSize } = req.query
    const pageNumber = parseInt(page == 0 ? 1 : page)
    const pageSizeNumber = parseInt(pageSize)
    const skip = (pageNumber - 1) * pageSizeNumber

    try {
        let query = {}

        if (searchValue) {
            query[searchColumn] = { $regex: new RegExp(searchValue, 'i') }
        }

        let contentQuery = User.find(query).skip(skip).limit(pageSizeNumber)

        const [content, totalData] = await Promise.all([
            contentQuery.exec(),
            User.countDocuments(query),
        ])

        res.status(200).json({ message: 'Datos actualizados', content, totalData })
    } catch (error) {
        res.status(404).json({ error: 'Usuario no encontrado' })
    }
})

// Obtener info del usuario para mostrar:
userRouter.get('/api/getUserData', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)

    try {
        const user = await User.findOne({ rut: decodedToken.rut })
        const name = user.nombres.split(' ')[0]

        res.status(200).json({ message: 'Usuario encontrado!', nombres: name })
    } catch(error) {
        console.log('No se pudo encontrar el usuario!')
        res.status(404).json({ error: 'Usuario no encontrado.' })
    }
})

// Obtener data para la tabla filtrada (botones de navegación):
userRouter.get('/api/filterUsers', async (req, res) => {
    const { column, sendOrder, pageSize, page } = req.query

    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    const skip = (pageNumber - 1) * pageSizeNumber;

    try {
        let query = {}

        if (column !== '' && sendOrder !== 0) {
            const sort = {}
            sort[column] = parseInt(sendOrder)

            query = User.find({}).sort(sendOrder === 0 || sendOrder === '0' ? {} : sort).skip(skip).limit(pageSizeNumber)
        } else {
            query = User.find({}).skip(skip).limit(pageSizeNumber)
        }

        const [content, totalData] = await Promise.all([
            query.exec(),
            User.countDocuments(),
        ])

        return res.status(200).json({ message: 'Data filtered!', content, totalData })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// Crear un nuevo usuario:
userRouter.post('/api/newUser', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)

    const user = await User.findOne({ rut: decodedToken.rut })

    if (user.rol === 'superAdmin') {
        const checkUser = await User.findOne({ rut: req.body.rut })
        if (!checkUser) {
            const { rut, nombres, apellidos, email, passHash, rol, dependencias, direcciones, numMunicipal, anexoMunicipal } = req.body
            
            try {
                const salt = 10
                const hash = await bcrypt.hash(passHash, salt)
                const user = new User({
                    rut,
                    nombres,
                    apellidos,
                    email,
                    passHash: hash,
                    rol,
                    dependencias,
                    direcciones,
                    numMunicipal,
                    anexoMunicipal
                })
    
                await user.save()
                console.log('Usuario creado!')
                res.status(201).json({ message: 'Usuario creado!' })
            } catch (error) {
                res.status(500).json({ error: 'Error al crear el usuario.' })
            }

            
        } else {
            res.status(409).json({ message: 'El usuario ya existe en la base de datos.' })
        }
    } else {
        res.status(401).json({ message: 'Este usuario no puede crear nuevos usuarios!' })
    }
})

// Actualizar un usuario:
userRouter.put('/api/update/', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)

    const user = await User.findOne({ rut: decodedToken.rut })
    const { values, pageSize, page } = req.body

    const pageNumber = parseInt(page)
    const pageSizeNumber = parseInt(pageSize)
    const skip = (pageNumber - 1) * pageSizeNumber


    if (user.rol === 'superAdmin' || user.rol === 'admin') {
        try {
            const content = await User.find({}).skip(skip).limit(pageSizeNumber)
            const updateUser = content[values[0].rowIndex]

            const newUser = {}
            values.forEach(({ columnId, value }) => {
                newUser[columnId] = value
            })

            await User.findByIdAndUpdate(updateUser._id, newUser, { new: true, runValidators: true, context: 'query' })
            console.log('Usuario actualizado!')
            res.status(200).json({ message: 'Se actualizó el usuario!' })
        } catch(error) {
            res.status(404).json({ error: 'Usuario no encontrado' })
        }
    }
})

// Eliminar un usuario:
userRouter.delete('/api/delete/:rut', async (req, res) => {
    try {
        const user = await User.findOne({rut: req.params.rut})
        await User.findByIdAndDelete(user._id)
        res.status(204).json({ message: 'Usuario eliminado.' })
    } catch(error) {
        res.status(404).json({ error: 'Usuario no encontrado.' })
    }
})

// Crear un nuevo admin
userRouter.put('/api/newAdmin/:rut', async (req, res, next) => {
    try {
        const user = await User.findOne({ rut: req.params.rut })
        const newUser = await User.findByIdAndUpdate(user._id, { rol: user.rol === 'admin' ? 'user' : 'admin' }, { new: true, runValidators: true, context: 'query' })
        newUser.rol === 'admin'
            ? res.status(200).json({ message: 'Este usuario es ahora un admin!' })
            : res.status(200).json({ message: 'Este usuario ha dejado de ser un admin' })
    } catch(error) {
        res.status(401).json({ error: 'No se encontró al usuario!' })
    }
})

module.exports = userRouter