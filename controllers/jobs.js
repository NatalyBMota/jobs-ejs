const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const wantsHTML = (req) => req.accepts('html')

const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
    if (wantsHTML(req)) {
        return res.status(StatusCodes.OK).render('jobs', { jobs })
    }
    res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
}

const getJob = async (req, res) => {
    const {
        user: { userId },
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

const getNewJobForm = async (req, res) => {
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
            status: 'pending',
        },
    })
}

const getEditJobForm = async (req, res) => {
    const {
        user: { userId },
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

const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId
    await Job.create(req.body)

    if (wantsHTML(req)) {
        return res.redirect('/jobs?message=The job entry was created.')
    }

    const job = await Job.findOne(req.body)
    res.status(StatusCodes.CREATED).json({ job })
}

const updateJob = async (req, res) => {
    const {
        body: { company, position },
        user: { userId },
        params: { id: jobId },
    } = req

    if (company === '' || position === '') {
        throw new BadRequestError('Company or Position fields cannot be empty')
    }

    const job = await Job.findByIdAndUpdate(
        { _id: jobId, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    )

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`)
    }

    if (wantsHTML(req)) {
        return res.redirect('/jobs?message=The job entry was updated.')
    }

    res.status(StatusCodes.OK).json({ job })
}

const deleteJob = async (req, res) => {
    const {
        user: { userId },
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
        return res.redirect('/jobs?message=The entry was deleted.')
    }

    res.status(StatusCodes.OK).json({ msg: 'The entry was deleted.' })
}

module.exports = {
    createJob,
    deleteJob,
    getAllJobs,
    getNewJobForm,
    getEditJobForm,
    updateJob,
    getJob,
}