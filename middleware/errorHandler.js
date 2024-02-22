const errorHandler = (error, req, res, next) => {
    const verificationRegex = /Usuario no encontrado/g
    const alreadyExists = /El usuario ya existe en la base de datos./g

    if (verificationRegex.test(error)) {
        return res.status(404).json({ message: 'El usuario no existe en la base de datos.' })
    } else if (alreadyExists.test(error)) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese rut registrado.' })
    } else {
        console.log(error)
    }
}

const endpointTypo = (req, res) => {
    res.status(404).send({ error: 'Hay un error en la url.' })
}

module.exports = { errorHandler, endpointTypo }