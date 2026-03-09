const express = require('express')

const router = express.Router()
const {
    createFriendBday,
    deleteFriendBday,
    getAllFriendsBdays,
    getNewFriendBdayForm,
    getEditFriendBdayForm,
    updateFriendBday,
} = require('../controllers/jobs')

router.route('/').post(createFriendBday).get(getAllFriendsBdays)
router.route('/new').get(getNewFriendBdayForm)
router.route('/edit/:id').get(getEditFriendBdayForm)
router.route('/update/:id').post(updateFriendBday)
router.route('/delete/:id').post(deleteFriendBday)
router.route('/:id').patch(updateFriendBday)

module.exports = router