const filterRouter = require('express').Router()
const User = require('../models/user')

// Filtrando datos de la tabla:
filterRouter.get('/api/filter/', async (req, res) => {
    const { column, order, searchValue, searchColumn, pageSize, page } = req.query

    const pageNumber = parseInt(page)
    const pageSizeNumber = parseInt(pageSize)
    const skip = (pageNumber - 1) * pageSizeNumber

    const filterOrder = order === 'asc' ? 1 : order === 'normal' ? 0 : -1

    if (searchValue === '') {
        try {
            if (filterOrder !== 0) {
                const filteredData = await User.find({}).sort({ [column]: filterOrder }).skip(skip).limit(pageSizeNumber)
                const totalData = await User.find({}).sort({ [column]: filterOrder }).countDocuments()
                const content = filteredData

                res.status(200).json({ content, totalData })
            } else  if (filterOrder === 0) {
                const filteredData = await User.find({}).skip(skip).limit(pageSizeNumber)
                const totalData = await User.find({}).countDocuments()
                const content = filteredData

                res.status(200).json({ content, totalData })
            } else {
                res.status(400).json({ error: 'Orden inválido.' })
            }
        } catch(error) {
            res.status(404).json({ message: 'Hubo un problema :c', error })
        }
    } else {
        try {
            if (filterOrder !== 0) {
                const regex = new RegExp(searchValue, 'i')
                const totalData = await User.find({
                    $or: [
                        { [searchColumn]: { $regex: regex } }
                    ]
                }).countDocuments()

                const filteredData = await User.find({
                    $or: [
                        { [searchColumn]: { $regex: regex } }
                    ]
                }).sort({ [column]: filterOrder }).skip(skip).limit(pageSizeNumber)
                const content = filteredData

                res.status(200).json({ content, totalData })
            }
        } catch(error) {
            res.status(404).json({ error: 'Hubo otro error D:' })
        }
    }
})

// Buscando datos en la tabla que coincidan con el término de búsqueda:
filterRouter.get('/api/filter/search', async (req, res) => {
    const { column, value, pageSize, page } = req.query

    const pageNumber = parseInt(page)
    const pageSizeNumber = parseInt(pageSize)
    const skip = (pageNumber - 1) * pageSizeNumber

    const regexPattern = new RegExp(value, 'i')

    try {
        const totalData = await User.find({
            $or: [
                { [column]: { $regex: regexPattern } }
            ]
        }).countDocuments()

        const filteredData = await User.find({
            $or: [
                { [column]: { $regex: regexPattern } }
            ]
        }).skip(skip).limit(pageSizeNumber)
        const content = filteredData

        res.status(200).json({ content, totalData })
    } catch(error) {
        res.status(404).json({ message: 'Hubo un problema :c', error })
    }
})

module.exports = filterRouter