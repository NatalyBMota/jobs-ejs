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
        firstName: friendBday.firstName || friendBday.company,
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
        return res.status(StatusCodes.OK).render('jobs/new', {
            pageTitle: 'add job',
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
        return res.status(StatusCodes.OK).render('jobs/edit', {
            pageTitle: 'edit job',
            job: friendBday,
            message: '',
        })
    }

    res.status(StatusCodes.OK).json({ job: friendBday })
}

const createFriendBday = async (req, res) => {
    const firstName = req.body.firstName
    const lastName = req.body.lastName

    if (firstName === '' || lastName === '') {
        throw new BadRequestError('First Name or Last Name fields cannot be empty')
    }

    normalizeBirthdayFields(req.body)

    req.body.createdBy = req.user._id
    await FriendsBdays.create(req.body)

    if (wantsHTML(req)) {
        return res.redirect('/friendsBday?message=The friend birthday entry was created.')
    }

    const friendBday = await FriendsBdays.findOne(req.body)
    res.status(StatusCodes.CREATED).json({ friendBday })
}

const updateFriendBday = async (req, res) => {
    const {
        body: { firstName, lastName },
        user: { _id: userId },
        params: { id: friendBdayId },
    } = req

    if (firstName === '' || lastName === '') {
        throw new BadRequestError('First Name or Last Name fields cannot be empty')
    }

    normalizeBirthdayFields(req.body)

    const friendBday = await FriendsBdays.findOneAndUpdate(
        { _id: friendBdayId, createdBy: userId },
        req.body,
        { returnDocument: 'after', runValidators: true }
    )

    if (!friendBday) {
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }

    if (wantsHTML(req)) {
        return res.redirect('/friendsBday?message=The job entry was updated.')
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
        throw new NotFoundError(`No entry with id ${friendBdayId}`)
    }

    if (wantsHTML(req)) {
        return res.redirect('/friendsBday?message=The entry was deleted.')
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