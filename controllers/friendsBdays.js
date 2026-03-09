const Job = require('../models/FriendsBdays')
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
    const month = body.month || body.status
    const day = Number(body.day)

    if (!month || !Object.prototype.hasOwnProperty.call(DAYS_IN_MONTH, month)) {
        throw new BadRequestError('Please select a valid month')
    }

    if (!Number.isInteger(day)) {
        throw new BadRequestError('Day must be a whole number')
    }

    if (day < 1 || day > DAYS_IN_MONTH[month]) {
        throw new BadRequestError(`Day must be between 1 and ${DAYS_IN_MONTH[month]} for ${month}`)
    }

    body.status = month
    body.day = day
    delete body.month
}

const getAllFriendsBdays = async (req, res) => {
    const userId = req.user._id
    const jobs = await Job.find({ createdBy: userId }).sort('createdAt')
    if (wantsHTML(req)) {
         const friends = jobs.map((job) => ({
            _id: job._id,
            firstName: job.company,
            lastName: job.position,
            birthdayMonth: job.status,
            birthdayDay: job.day,
        }))

        return res.status(StatusCodes.OK).render('friendsBdays', { friends })
    }
    res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
}

const getFriendsBdays = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: jobId },
    } = req

    const job = await Job.findOne({
        _id: jobId,
        createdBy: userId,
    })
    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`)
    }
    res.status(StatusCodes.OK).json({ job })
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
            company: '',
            position: '',
            month: 'January',
            day: 1,
        },
    })
}

const getEditFriendBdayForm = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: jobId },
    } = req

    const job = await Job.findOne({
        _id: jobId,
        createdBy: userId,
    })
    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`)
    }

    if (wantsHTML(req)) {
        return res.status(StatusCodes.OK).render('jobs/edit', {
            pageTitle: 'edit job',
            job,
            message: '',
        })
    }

    res.status(StatusCodes.OK).json({ job })
}

const createFriendBday = async (req, res) => {
    normalizeBirthdayFields(req.body)

    req.body.createdBy = req.user._id
    await Job.create(req.body)

    if (wantsHTML(req)) {
        return res.redirect('/friendsBday?message=The job entry was created.')
    }

    const job = await Job.findOne(req.body)
    res.status(StatusCodes.CREATED).json({ job })
}

const updateFriendBday = async (req, res) => {
    const {
        body: { company, position },
        user: { _id: userId },
        params: { id: jobId },
    } = req

    if (company === '' || position === '') {
        throw new BadRequestError('Company or Position fields cannot be empty')
    }

    normalizeBirthdayFields(req.body)

    const job = await Job.findOneAndUpdate(
        { _id: jobId, createdBy: userId },
        req.body,
        { returnDocument: 'after', runValidators: true }
    )

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`)
    }

    if (wantsHTML(req)) {
        return res.redirect('/friendsBday?message=The job entry was updated.')
    }

    res.status(StatusCodes.OK).json({ job })
}

const deleteFriendBday = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: jobId },
    } = req

    const job = await Job.findOneAndDelete({
        _id: jobId,
        createdBy: userId,
    })

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`)
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