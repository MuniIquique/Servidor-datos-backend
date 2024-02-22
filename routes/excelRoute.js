const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/api/ExcelDownload/', (req, res) => {
    const newFilePath = path.join(__dirname, '../output.xlsx')
    res.download(newFilePath, 'output.xlsx')
})

module.exports = router