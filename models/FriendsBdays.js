const mongoose = require('mongoose')

const FriendsBdaysSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please provide first name'],
            maxlength: 50,
        },
        lastName: {
            type: String,
            required: [true, 'Please provide last name'],
            maxlength: 100,
        },
        birthdayMonth: {
            type: String,
            enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            default: 'January',
        },
        birthdayDay: {
            type: Number,
            required: [true, 'Please provide a day'],
            min: 1,
            max: 31,
            validate: {
                validator: Number.isInteger,
                message: 'Day must be a whole number',
            },
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please provide user'],
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('FriendsBdays', FriendsBdaysSchema)