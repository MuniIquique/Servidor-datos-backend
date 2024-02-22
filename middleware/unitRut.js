const uniqueRut = (user) => {
    if (user) {
        if (bcrypt.compareSync(password, user.passHash)) {
            console.log('Credenciales correctas!!!')
            res.status(200).json(user.rol === 'superAdmin' ? { access: 'superAdmin', user } : user.rol === 'admin' ? { access: 'admin', user } : { access: 'user', user })
        } else {
            console.log('Credenciales incorrectas.')
            res.status(401).json({ message: 'La contraseña es incorrecta D:' })
        }
    } else {
        console.log('Usuario no encontrado.')
        res.status(404).json({ message: 'Usuario no encontrado.' })
    }
}
