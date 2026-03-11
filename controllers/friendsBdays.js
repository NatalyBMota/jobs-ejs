const FriendsBdays = require('../models/FriendsBdays')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const wantsHTML = (req) => req.accepts('html')

const DAYS_IN_MONTH = {
    January: 31,
    February: 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
}

const FIRST_NAME_INVALID_MESSAGE =
    'First Name must start with a letter, and the second character must be a letter or an apostrophe. If the second character is an apostrophe, the third character must be a letter. First Name may contain at most one dash, may contain at most one apostrophe, may contain at most one space in the middle, may not contain any other special characters, and may not contain any numeric digits.'

const LAST_NAME_INVALID_MESSAGE =
    'Last Name must start with at least two letters, may contain at most one dash, and may not contain other special characters, any numeric digits, nor any spaces.'

const normalizePersonName = (value) => (typeof value === 'string' ? value.trim() : '')

const escapeApostropheForStorage = (value) =>
    (typeof value === 'string' ? value.replace(/'/g, "\\'") : value)

const unescapeApostropheForDisplay = (value) =>
    (typeof value === 'string' ? value.replace(/\\'/g, "'") : value)

const validateFirstName = (value, maxLength) => {
    const normalized = normalizePersonName(value)

    if (!normalized) {
        return { valid: false, message: 'First Name field cannot be empty' }
    }

    if (normalized.length > maxLength) {
        return { valid: false, message: `First Name cannot be longer than ${maxLength} characters` }
    }

    const startsWithValidFirstNamePrefix = /^([A-Za-z]{2}|[A-Za-z]'[A-Za-z])/.test(normalized)
    if (!startsWithValidFirstNamePrefix) {
        return { 
            valid: false, 
            message: FIRST_NAME_INVALID_MESSAGE 
        }
    }

    if (/[^A-Za-z '\-]/.test(normalized) || /\d/.test(normalized)) {
        return { valid: false, message: FIRST_NAME_INVALID_MESSAGE }
    }

    const dashCount = (normalized.match(/-/g) || []).length
    if (dashCount > 1) {
        return { valid: false, message: FIRST_NAME_INVALID_MESSAGE }
    }

    const apostropheCount = (normalized.match(/'/g) || []).length
    if (apostropheCount > 1) {
        return { valid: false, message: FIRST_NAME_INVALID_MESSAGE }
    }

    const spaceCount = (normalized.match(/ /g) || []).length
    if (spaceCount > 1) {
        return { valid: false, message: FIRST_NAME_INVALID_MESSAGE }
    }

    if (/^[ '\-]|[ '\-]$|--|''|  |- | -|' | '/.test(normalized)) {
        return { valid: false, message: FIRST_NAME_INVALID_MESSAGE }
    }

    return { valid: true, value: normalized }
}

const validateLastName = (value, maxLength) => {
    const normalized = normalizePersonName(value)

    if (!normalized) {
        return { valid: false, message: 'Last Name field cannot be empty' }
    }

    if (normalized.length > maxLength) {
        return { valid: false, message: `Last Name cannot be longer than ${maxLength} characters` }
    }

    if (!/^[A-Za-z]{2,}/.test(normalized)) {
        return { valid: false, message: LAST_NAME_INVALID_MESSAGE }
    }

    if (/[^A-Za-z-]/.test(normalized) || /\d/.test(normalized) || /\s/.test(normalized)) {
        return { valid: false, message: LAST_NAME_INVALID_MESSAGE }
    }

    const dashCount = (normalized.match(/-/g) || []).length
    if (dashCount > 1) {
        return { valid: false, message: LAST_NAME_INVALID_MESSAGE }
    }

    if (/^-|-$|--/.test(normalized)) {
        return { valid: false, message: LAST_NAME_INVALID_MESSAGE }
    }

    return { valid: true, value: normalized }
}

const respondValidationError = (req, res, message, redirectPath) => {
    if (wantsHTML(req)) {
        req.flash('error', message)
        return res.redirect(redirectPath)
    }
    throw new BadRequestError(message)
}

const normalizeBirthdayFields = (body) => {
    const birthdayMonth = body.birthdayMonth || body.month || body.status
    const birthdayDay = Number(body.birthdayDay ?? body.day)

    if (!birthdayMonth || !Object.prototype.hasOwnProperty.call(DAYS_IN_MONTH, birthdayMonth)) {
        throw new BadRequestError('Please select a valid month')
    }

    if (!Number.isInteger(birthdayDay)) {
        throw new BadRequestError('Day must be a whole number')
    }

    if (birthdayDay < 1 || birthdayDay > DAYS_IN_MONTH[birthdayMonth]) {
        throw new BadRequestError(`Day must be between 1 and ${DAYS_IN_MONTH[birthdayMonth]} for ${birthdayMonth}`)
    }

    body.birthdayMonth = birthdayMonth
    body.birthdayDay = birthdayDay

    delete body.month
    delete body.day
    delete body.status
}

const getAllFriendsBdays = async (req, res) => {
    const userId = req.user._id
    const friendBdays = await FriendsBdays.find({ createdBy: userId }).sort('createdAt')
    if (wantsHTML(req)) {
         const friends = friendBdays.map((friendBday) => ({
            _id: friendBday._id,
            firstName: friendBday.firstName
            ? unescapeApostropheForDisplay(friendBday.firstName)
            : friendBday.company,
            lastName: friendBday.lastName || friendBday.position,
            birthdayMonth: friendBday.birthdayMonth || friendBday.status,
            birthdayDay: friendBday.birthdayDay || friendBday.day,
        }))

        return res.status(StatusCodes.OK).render('friendsBdays', { friends })
    }
    res.status(StatusCodes.OK).json({ friendBdays, count: friendBdays.length })
}

const getFriendsBdays = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: friendBdayId },
    } = req

    const friendBday = await FriendsBdays.findOne({
        _id: friendBdayId,
        createdBy: userId,
    })
    if (!friendBday) {
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }
    res.status(StatusCodes.OK).json({ friendBday })
}

const getNewFriendBdayForm = async (req, res) => {
    if (wantsHTML(req)) {
        return res.status(StatusCodes.OK).render('friendBdays/new', {
            pageTitle: 'add friend\'s birthday',
            message: '',
        })
    }
    res.status(StatusCodes.OK).json({
        form: {
            firstName: '',
            lastName: '',
            birthdayMonth: 'January',
            birthdayDay: 1,
        },
    })
}

const getEditFriendBdayForm = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: friendBdayId },
    } = req

    const friendBday = await FriendsBdays.findOne({
        _id: friendBdayId,
        createdBy: userId,
    })
    if (!friendBday) {
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }

    if (wantsHTML(req)) {
        const friendsBirthdayData = friendBday.toObject()
        friendsBirthdayData.firstName = unescapeApostropheForDisplay(friendsBirthdayData.firstName)

        return res.status(StatusCodes.OK).render('friendBdays/edit', {
            pageTitle: 'edit friend\'s birthday',
            friendsBirthdayData,
            message: '',
        })
    }

    res.status(StatusCodes.OK).json({ job: friendBday })
}

const createFriendBday = async (req, res) => {
    const firstNameCheck = validateFirstName(req.body.firstName, 50)
    if (!firstNameCheck.valid) {
        return respondValidationError(req, res, firstNameCheck.message, '/friendsBday/new')
    }

    const lastNameCheck = validateLastName(req.body.lastName, 100)
    if (!lastNameCheck.valid) {
        return respondValidationError(req, res, lastNameCheck.message, '/friendsBday/new')
    }

    req.body.firstName = escapeApostropheForStorage(firstNameCheck.value)
    req.body.lastName = lastNameCheck.value

    try {
        normalizeBirthdayFields(req.body)
    } catch (err) {
        if (err instanceof BadRequestError) {
            return respondValidationError(req, res, err.message, '/friendsBday/new')
        }
        throw err
    }

    req.body.createdBy = req.user._id
    await FriendsBdays.create(req.body)

    if (wantsHTML(req)) {
        req.flash('info', 'The friend birthday entry was created.')
        return res.redirect('/friendsBday')
    }

    const friendBday = await FriendsBdays.findOne(req.body)
    res.status(StatusCodes.CREATED).json({ friendBday })
}

const updateFriendBday = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: friendBdayId },
    } = req

    const firstNameCheck = validateFirstName(req.body.firstName, 50)
    if (!firstNameCheck.valid) {
        return respondValidationError(
            req,
            res,
            firstNameCheck.message,
            `/friendsBday/edit/${friendBdayId}`
        )
    }

    const lastNameCheck = validateLastName(req.body.lastName, 100)
    if (!lastNameCheck.valid) {
        return respondValidationError(
            req,
            res,
            lastNameCheck.message,
            `/friendsBday/edit/${friendBdayId}`
        )
    }

    req.body.firstName = escapeApostropheForStorage(firstNameCheck.value)
    req.body.lastName = lastNameCheck.value

    try {
        normalizeBirthdayFields(req.body)
    } catch (err) {
        if (err instanceof BadRequestError) {
            return respondValidationError(req, res, err.message, `/friendsBday/edit/${friendBdayId}`)
        }
        throw err
    }

    const friendBday = await FriendsBdays.findOneAndUpdate(
        { _id: friendBdayId, createdBy: userId },
        req.body,
        { returnDocument: 'after', runValidators: true }
    )

    if (!friendBday) {
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }

    if (wantsHTML(req)) {
        req.flash('info', 'The friend\'s birthday entry was updated.')
        return res.redirect('/friendsBday')
    }

    res.status(StatusCodes.OK).json({ friendBday })
}

const deleteFriendBday = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: friendBdayId },
    } = req

    const friendBday = await FriendsBdays.findOneAndDelete({
        _id: friendBdayId,
        createdBy: userId,
    })

    if (!friendBday) {
        if (wantsHTML(req)) {
            req.flash('error', 'That entry no longer exists or was already deleted.')
            return res.redirect('/friendsBday')
        }
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }

    if (wantsHTML(req)) {
        req.flash('info', 'The entry was deleted.')
        return res.redirect('/friendsBday')
    }

    res.status(StatusCodes.OK).json({ msg: 'The entry was deleted.' })
}

module.exports = {
    createFriendBday,
    deleteFriendBday,
    getAllFriendsBdays,
    getNewFriendBdayForm,
    getEditFriendBdayForm,
    updateFriendBday,
    getFriendsBdays,
}