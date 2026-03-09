const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: [true, 'Please provide company name'],
            maxlength: 50,
        },
        position: {
            type: String,
            required: [true, 'Please provide position'],
            maxlength: 100,
        },
        status: {
            type: String,
            enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            default: 'January',
        },
        day: {
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

module.exports = mongoose.model('Job', JobSchema)