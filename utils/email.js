const nodemailer = require('nodemailer')

const send = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASS
    }
})

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: 'muniemail@gmail.com',
      to,
      subject,
      text,
    }   

    try {
      const info = await send.sendMail(mailOptions)
      // console.log('Correo enviado: ' + info.response)
    } catch (error) {
      console.error('Error enviando el correo de recuperación de contraseña: ', error)
    }
}

module.exports = sendEmail
