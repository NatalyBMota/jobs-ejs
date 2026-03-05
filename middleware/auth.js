const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization
    const headerToken = authHeader && authHeader.startsWith('Bearer')
        ? authHeader.split(' ')[1]
        : null
    const cookieToken = req.cookies ? req.cookies.token : null
    const token = headerToken || cookieToken

    if (!token) {
        if (req.accepts('html')) {
            return res.redirect('/auth/login')
        }
        throw new UnauthenticatedError('Authentication invalid')
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = { userId: payload.userId, name: payload.name }
        next()
    } catch (error) {
        if (req.accepts('html')) {
            return res.redirect('/auth/login')
        }
        throw new UnauthenticatedError('Authentication invalid')
    }
}

module.exports = auth