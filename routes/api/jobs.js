const express = require('express')

const router = express.Router()
const {
    createFriendBday, 
    deleteFriendBday,
    getAllFriendsBdays,
    updateFriendBday,  
    getFriendsBdays, 
} = require('../../controllers/jobs')

router.route('/').post(createFriendBday).get(getAllFriendsBdays)
router.route('/:id').get(getFriendsBdays).delete(deleteFriendBday).patch(updateFriendBday)

module.exports = router