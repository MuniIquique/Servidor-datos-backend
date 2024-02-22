const dependencyRouter = require('express').Router()
const Dependency = require('../models/dependency')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const getToken = res => {
    const authorization = res.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '') 
    }
    return null
}

// Obteniendo las dependencias:
dependencyRouter.get('/api/getDependencies', async (req, res) => {
    try {
        const request = await Dependency.find({})
        res.status(200).json({ message: 'Dependencias obtenidas!', request })
    } catch(error) {
        res.status(404).json({ error: 'No se encontraron dependencias.' })
    }
})

// Creando una nueva dependencia:
dependencyRouter.post('/api/newDependency', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)

    const body = req.body
    const user = await User.findOne({ rut: decodedToken.rut })

    const existingDependency = await Dependency.findOne({ nombre: body.nombre })

    if (existingDependency) {
        return res.status(409).json({ error: 'Esta dependencia ya existe!' })
    }

    if (user.rol === 'superAdmin') {
        const newDependency = new Dependency({
            nombre: body.nombre,
            direccion: body.direccion
        })

        await newDependency.save()
        console.log('Dependencia creada!')
        res.status(201).json({ message: 'Dependencia creada!' })
    } else {
        res.status(401).json({ error: 'No tienes los permisos necesarios para crear una dependencia.' })
    }
})

// Eliminando una dependencia:
dependencyRouter.delete('/api/deleteDependency/:index', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)
    
    const user = await User.findOne({ rut: decodedToken.rut })

    if (user.rol === 'superAdmin') {
        try {
            const allDependencies = await Dependency.find({})
            const deleteDep = allDependencies[req.params.index]
            await Dependency.findByIdAndDelete(deleteDep._id)
            res.status(204).json({ message: 'Dependencia eliminada.' })
        } catch(error) {
            res.status(404).json({ error: 'Dependencia no encontrada.' })
        }   
    }
})

// Actualizando una dependencia:
dependencyRouter.put('/api/updateDependency/:index', async (req, res) => {
    const decodedToken = jwt.verify(getToken(req), process.env.SECRET)
    
    const user = await User.findOne({ rut: decodedToken.rut })

    if (user.rol === 'superAdmin') {
        const body = req.body

        try {
            const allDependencies = await Dependency.find({})
            const updateDep = allDependencies[req.params.index]
            if (body.newName !== null) {
                await Dependency.findByIdAndUpdate(updateDep._id, { nombre: body.newName })
            } else if (body.newDirection !== null) {
                await Dependency.findByIdAndUpdate(updateDep._id, { direccion: body.newDirection })
            } else {
                await Dependency.findByIdAndUpdate(updateDep._id, { nombre: body.newName, direccion: body.newDirection })
            }
            res.status(200).json({ message: 'Dependencia actualizada!' })
        } catch(error) {
            res.status(404).json({ error: 'Hubo un error al actualizar! D:' })
        }
    } else {
        res.status(401).json({ error: 'No tienes los permisos suficientes para editar una dependencia!' })
    }
})

module.exports = dependencyRouter