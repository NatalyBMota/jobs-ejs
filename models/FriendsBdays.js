const mongoose = require('mongoose')

const FriendsBdaysSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please provide first name'],
            trim: true,
            maxlength: [50, 'First Name cannot be longer than 50 characters'],
            validate: [
                {
                    validator: function (value) {
                        const unescaped = typeof value === 'string' ? value.replace(/\\'/g, "'") : value

                        if (typeof unescaped !== 'string') return false
                        if (unescaped.includes('\\')) return false
                        if (!/^([A-Za-z]{2}|[A-Za-z]'[A-Za-z])/.test(unescaped)) return false
                        if (/[^A-Za-z '\-]/.test(unescaped) || /\d/.test(unescaped)) return false

                        const dashCount = (unescaped.match(/-/g) || []).length
                        if (dashCount > 1) return false

                        const apostropheCount = (unescaped.match(/'/g) || []).length
                        if (apostropheCount > 1) return false

                        const spaceCount = (unescaped.match(/ /g) || []).length
                        if (spaceCount > 1) return false

                        if (/^[ '\-]|[ '\-]$|--|''|  |- | -|' | '/.test(unescaped)) return false

                        return true
                    },
                    message:
                        "First Name must start with at least two letters, may contain at most one dash, may contain at most one apostrophe, may contain at most one space in the middle, may not contain any other special characters, and may not contain any numeric digits.",
                },
            ],
        },
        lastName: {
            type: String,
            required: [true, 'Please provide last name'],
            trim: true,
            maxlength: [100, 'Last Name cannot be longer than 100 characters'],
            validate: [
                {
                    validator: function (value) {
                        if (!/^[A-Za-z]{2,}/.test(value)) return false
                        if (/[^A-Za-z-]/.test(value) || /\d/.test(value) || /\s/.test(value)) return false
                        const dashCount = (value.match(/-/g) || []).length
                        if (dashCount > 1) return false
                        if (/^-|-$|--/.test(value)) return false
                        return true
                    },
                    message:
                        'Last Name must start with at least two letters, may contain at most one dash, and may not contain other special characters, any numeric digits, nor any spaces.',
                },
            ],
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