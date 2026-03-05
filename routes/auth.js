const express = require('express')
const router = express.Router()

const {
    showLoginPage,
    showRegisterPage,
    login,
    register,
    logout,
} = require('../controllers/auth')

router.get('/login', showLoginPage)
router.get('/register', showRegisterPage)
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

module.exports = router