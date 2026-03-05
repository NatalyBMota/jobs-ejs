const express = require('express')

const router = express.Router()
const {
    createJob,
    deleteJob,
    getAllJobs,
    getNewJobForm,
    getEditJobForm,
    updateJob,
} = require('../controllers/jobs')

router.route('/').post(createJob).get(getAllJobs)
router.route('/new').get(getNewJobForm)
router.route('/edit/:id').get(getEditJobForm)
router.route('/update/:id').post(updateJob)
router.route('/delete/:id').post(deleteJob)
router.route('/:id').patch(updateJob)

module.exports = router