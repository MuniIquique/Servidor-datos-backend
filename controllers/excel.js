const excelRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const ExcelJS = require('exceljs')

const multer = require('multer')
const xlsx = require('xlsx')

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Leyendo data de un excel y subiéndola a la base de datos:
excelRouter.post('/api/uploadExcel', upload.single('excelFile'), async (req, res) => {
    try {
        const excelBuffer = req.file.buffer

        // Creando el archivo excel
        const workbook = xlsx.read(excelBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        const excelObject = xlsx.utils.sheet_to_json(sheet, { header: 'A' })
        const excelValues = excelObject.shift()
        
        const idealHeaders = ['Rut', 'Nombres', 'Apellidos', 'Correo electrónico', 'Rol', 'Dependencias', 'Direcciones', 'Número Municipal', 'Anexo']
        
        // Revisando si hay algún typo en los headers del excel subido:
        const trueHeaders = Object.values(excelValues)
        const typos = trueHeaders.filter(header => !idealHeaders.includes(header))

        if (typos.length > 0) {
            return res.status(400).json({ message: 'Un header tiene un error!', typos })
        }

        // Revisando si hay una columna extra o una menos:
        const extra = trueHeaders.filter(header => !idealHeaders.includes(header))
        if (extra.length > 0) {
            console.warn('Extra column detected.')
        }
        const less = idealHeaders.filter(header => !trueHeaders.includes(header))
        if (less.length > 0) {
            return res.status(400).json({ message: 'Hay una columna menos. Asegúrse que todas las columnas existen!' })
        }

        let excelArray = []
        for (let i = 0; i < excelObject.length; i++) {
            excelArray.push(Object.values(excelObject[i]))
        }

        let headers = Object.values(excelValues)

        const finalArray = excelArray.map(row => {
            const obj = {}
            headers.forEach((header, index) => {
                obj[header] = row[index]
            })
            return obj
        })

        // Objeto para transformar las keys del archivo excel en field names de mongodb:
        const fieldNamesMongo = {
            'Rut': 'rut',
            'Nombres': 'nombres',
            'Apellidos': 'apellidos',
            'Correo electrónico': 'email',
            'Rol': 'rol',
            'Dependencias': 'dependencias',
            'Direcciones': 'direcciones',
            'Número Municipal': 'numMunicipal',
            'Anexo': 'anexoMunicipal'
        }

        const newArray = finalArray.map(original => {
            const modifiedObj = {}
            for (const key in original) {
                const modifiedKey = fieldNamesMongo[key] || key;
                modifiedObj[modifiedKey] = original[key];
            }
            return modifiedObj
        })

        for (let i = 0; i < newArray.length; i++) {
            const newUser = new User({
                rut: newArray[i].rut,
                nombres: newArray[i].nombres,
                apellidos: newArray[i].apellidos,
                email: newArray[i].email,
                passHash: null,
                rol: newArray[i].rol,
                dependencias: newArray[i].dependencias,
                direcciones: newArray[i].direcciones,
                numMunicipal: newArray[i].numMunicipal,
                anexoMunicipal: newArray[i].anexoMunicipal
            })

            await newUser.save()
            console.log('Usuario guardado!')
        }
        
        res.status(201).json({ message: 'Usuarios agregados a la base de datos!' })

    } catch(error) {
        console.log('Error al subir el archivo', error)
        res.status(500).json({ error: 'Error interno del sistema' })
    }
})

// Creación del archivo excel:
excelRouter.get('/api/download/', async (req, res) => {    
    const { users, page } = req.query

    // Creando el archivo excel:
    const workbook = new ExcelJS.Workbook()

    workbook.creator = 'System'
    workbook.lastModifiedBy = 'Backend Server'
    workbook.created = new Date()

    // Creando una página:
    const worksheet = workbook.addWorksheet('Tabla de usuarios')

    // Creando columnas:
    worksheet.columns = [
        { header: 'Rut', key: 'rut' },
        { header: 'Nombres', key: 'nombres' },
        { header: 'Apellidos', key: 'apellidos' },
        { header: 'Correo electrónico', key: 'email' },
        { header: 'Rol', key: 'rol' },
        { header: 'Dependencias', key: 'dependencias' },
        { header: 'Direcciones', key: 'direcciones' },
        { header: 'Número Municipal', key: 'numMunicipal' },
        { header: 'Anexo', key: 'anexoMunicipal' }
    ]

    const headers = worksheet.getRow(1)
    headers.eachCell(cell => {
        cell.style.font = { bold: true }
        cell.style.border = {
            top: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' }
        }
        cell.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: 'e0e0e0'
            }
        }
    })

    worksheet.columns.forEach((col, index) => {
        let maxLength = 0
        col.eachCell({}, cell => {
            maxLength = Math.max(maxLength, String(cell.value.length))
        })
        col.width = maxLength + 10

        const header = worksheet.getRow(1).getCell(index + 1).value
        if (header === 'email') {
            col.width = maxLength + 20
        }
    })

    const projection = {
        rut: 1,
        nombres: 1,
        apellidos: 1,
        email: 1,
        rol: 1,
        dependencias: 1,
        direcciones: 1,
        numMunicipal: 1,
        anexoMunicipal: 1,
    }

    if (users === 'todo') {
        const data = await User.find({}, projection)
        data.forEach(row => {
            worksheet.addRow(row)
        })
    } else {
        const pageNumber = parseInt(page)
        const getUsers = parseInt(users)
        const skip = (pageNumber - 1) * getUsers

        const data = await User.find({}, projection).skip(skip).limit(users)
        data.forEach(row => {
            worksheet.addRow(row)
        })
    }

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.style.border = {
            top: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            }
        })
    })

    const buffer = await workbook.xlsx.writeBuffer();

    res.header('Content-Type', 'application/octet-stream')
    res.header("Content-Disposition", "attachment; filename=userdata.xlsx")

    res.end(buffer, 'binary')
    console.log('Excel creado!')
})

// Creando una template:
excelRouter.get('/api/template', async (req, res) => {
    // Nuevo archivo excel
    const workbook = new ExcelJS.Workbook()

    workbook.creator = 'System'
    workbook.lastModifiedBy = 'Backend System'
    workbook.created = new Date()

    // Añadiendo una página:
    const worksheet = workbook.addWorksheet('Plantilla')

    // Añadiendo columnas:
    worksheet.columns = [
        { header: 'Rut', key: 'rut', width: 10 },
        { header: 'Nombres', key: 'nombres', width: 20 },
        { header: 'Apellidos', key: 'apellidos', width: 20 },
        { header: 'Correo electrónico', key: 'email', width: 30 },
        { header: 'Rol', key: 'rol', width: 10 },
        { header: 'Dependencias', key: 'dependencias', width: 20 },
        { header: 'Direcciones', key: 'direcciones', width: 20 },
        { header: 'Número Municipal', key: 'numMunicipal', width: 20 },
        { header: 'Anexo', key: 'anexoMunicipal', width: 20 }
    ]

    const headers = worksheet.getRow(1)
    headers.eachCell(cell => {
        cell.style.font = { bold: true }
        cell.style.border = {
            top: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' }
        }
        cell.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: 'e0e0e0'
            }
        }
    })

    const buffer = await workbook.xlsx.writeBuffer();

    res.header('Content-Type', 'application/octet-stream')
    res.header("Content-Disposition", "attachment; filename=template.xlsx")

    res.end(buffer, 'binary')
})

module.exports = excelRouter