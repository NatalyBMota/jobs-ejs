const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')

const isFormRequest = (req) =>
    req.is('application/x-www-form-urlencoded') || req.accepts('html')

const attachTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30,
    })
}

const validateRegisterName = (name) => {
    try {
        const trimmedName = typeof name === 'string' ? name.trim() : ''

        if (!trimmedName) {
            return { valid: false, message: 'Please provide name.' }
        }

        if (trimmedName.length < 3) {
            return { valid: false, message: 'Name must be at least 3 characters.' }
        }

        if (trimmedName.length > 50) {
            return { valid: false, message: 'Name cannot be longer than 50 characters.' }
        }

        if (!/^[A-Za-z ]+$/.test(trimmedName)) {
            return { valid: false, message: 'Name can contain letters and spaces only.' }
        }

        return { valid: true, value: trimmedName }
    } catch (e) {
        return { valid: false, message: 'Invalid name.' }
    }
}

const validateApiPassword = (password) => {
    try {
        const value = typeof password === 'string' ? password : ''

        if (!value) {
            return { valid: false, message: 'Please provide password.' }
        }

        if (/['"]/.test(value)) {
            return {
                valid: false,
                message: 'Password cannot contain single quotes or double quotes',
            }
        }

        if (value.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' }
        }

        return { valid: true }
    } catch (e) {
        return { valid: false, message: 'Invalid password input.' }
    }
}

const showLoginPage = async (req, res) => {
    res.status(StatusCodes.OK).render('auth/login', { pageTitle: 'logon', message: '' })
}

const showRegisterPage = async (req, res) => {
    res.status(StatusCodes.OK).render('auth/register', { pageTitle: 'register', message: '' })
}

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            if (isFormRequest(req)) {
                return res.status(StatusCodes.BAD_REQUEST).render('auth/register', {
                    pageTitle: 'register',
                    message: 'Please provide name, email, and password',
                })
            }
            throw new BadRequestError('Please provide name, email, and password')
        }

        const nameCheck = validateRegisterName(name)
        if (!nameCheck.valid) {
            if (isFormRequest(req)) {
                return res.status(StatusCodes.BAD_REQUEST).render('auth/register', {
                    pageTitle: 'register',
                    message: nameCheck.message,
                })
            }
            throw new BadRequestError(nameCheck.message)
        }

        const passwordCheck = validateApiPassword(password)
        if (!passwordCheck.valid) {
            if (isFormRequest(req)) {
                return res.status(StatusCodes.BAD_REQUEST).render('auth/register', {
                    pageTitle: 'register',
                    message: passwordCheck.message,
                })
            }
            throw new BadRequestError(passwordCheck.message)
        }

        const user = await User.create({
            ...req.body,
            name: nameCheck.value,
        })

        const token = user.createJWT()

        if (isFormRequest(req)) {
            attachTokenCookie(res, token)
            return res.redirect('/friendsBday')
        }

        return res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token })
    } catch (e) {
        if (e.constructor && e.constructor.name === 'ValidationError') {
            const messages = Object.keys(e.errors).map(
                (key) => `${key}: ${e.errors[key].properties.message}`
            )
            const message = messages.join(' | ')

            if (isFormRequest(req)) {
                return res.status(StatusCodes.BAD_REQUEST).render('auth/register', {
                    pageTitle: 'register',
                    message,
                })
            }

            return res.status(StatusCodes.BAD_REQUEST).json({ msg: message })
        }

        if (e.name === 'MongoServerError' && e.code === 11000) {
            const message = 'That email address is already registered.'

            if (isFormRequest(req)) {
                return res.status(StatusCodes.BAD_REQUEST).render('auth/register', {
                    pageTitle: 'register',
                    message,
                })
            }

            return res.status(StatusCodes.BAD_REQUEST).json({ msg: message })
        }

        return next(e)
    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        if (isFormRequest(req)) {
            return res.status(StatusCodes.BAD_REQUEST).render('auth/login', {
                pageTitle: 'logon',
                message: 'Please provide email and password',
            })
        }
        throw new BadRequestError('Please provide email and password')
    }

    const user = await User.findOne({ email })
    if (!user) {
        if (isFormRequest(req)) {
            return res.status(StatusCodes.UNAUTHORIZED).render('auth/login', {
                pageTitle: 'logon',
                message: 'Invalid Credentials',
            })
        }
        throw new UnauthenticatedError('Invalid Credentials')
    }

    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
        if (isFormRequest(req)) {
            return res.status(StatusCodes.UNAUTHORIZED).render('auth/login', {
                pageTitle: 'logon',
                message: 'Invalid Credentials',
            })
        }
        throw new UnauthenticatedError('Invalid Credentials')
    }

    const token = user.createJWT()

    if (isFormRequest(req)) {
        attachTokenCookie(res, token)
        return res.redirect('/friendsBday')
    }

    res.status(StatusCodes.OK).json({ user: { name: user.name }, token })
}

const logout = async (req, res) => {
    res.clearCookie('token')
    if (isFormRequest(req)) {
        return res.redirect('/auth/login')
    }
    res.status(StatusCodes.OK).json({ msg: 'Logged out' })
}

module.exports = {
    showLoginPage,
    showRegisterPage,
    register,
    login,
    logout,
}