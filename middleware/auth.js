const { UnauthenticatedError } = require('../errors')

const auth = (req, res, next) => {
    if (req.user) {
        return next()
    }

    if (req.accepts('html')) {
        return res.redirect('/sessions/logon')
    }

    throw new UnauthenticatedError('Authentication invalid')
}

module.exports = auth