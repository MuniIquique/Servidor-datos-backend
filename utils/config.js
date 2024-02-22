// Archivo que hace uso de las variables de entorno:
require('dotenv').config()

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URL
const SECRET = process.env.SECRET

module.exports = { MONGO_URI, PORT, SECRET }

// Los `process.env.PORT`, `process.env.MONGO_URL` y `process.env.SECRET` hacen referencia a las variables de entorno (archivo .env)
// EL arhcivo .env no se guarda en el repositorio github ya que normalmente son datos confidenciales, hay que crearlo antes de iniciar la app.
// El PORT debe ser el mismo que el de la app frontend.
// El MONGO_URL es una URL necesaria para conectarse a la base de datos.
// La URL de mongodb necesita 3 valores: nombre de usuario, contraseña, y el nombre de la base de datos.
// ---> mongodb+srv://<username>:<password>@cluster0.6ounrxy.mongodb.net/<nombre-base-de-datos>?retryWrites=true&w=majority
// Recuerda quitar los <>!
// El SECRET es una variable que usan los jsonwebtokens para verificar, firmar y decodificar tokens.
// Las 3 variables deben ser definidas en un archivo .env en la raíz del proyecto antes de iniciar la app!