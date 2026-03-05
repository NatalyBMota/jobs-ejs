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

const showLoginPage = async (req, res) => {
    res.status(StatusCodes.OK).render('auth/login', { pageTitle: 'logon', message: '' })
}

const showRegisterPage = async (req, res) => {
    res.status(StatusCodes.OK).render('auth/register', { pageTitle: 'register', message: '' })
}

const register = async (req, res) => {
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

    const user = await User.create({ ...req.body })
    const token = user.createJWT()

    if (isFormRequest(req)) {
        attachTokenCookie(res, token)
        return res.redirect('/jobs')
    }

    res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token })
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
        return res.redirect('/jobs')
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