const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        trim: true,
        maxlength: [50, 'Name cannot be longer than 50 characters'],
        minlength: [3, 'Name must be at least 3 characters'],
        match: [/^[A-Za-z ]+$/, 'Name can contain letters and spaces only'],
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        trim: true,
        lowercase: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide valid email',
        ],
        validate: [
            {
                validator: function (value) {
                    return !/['"]/.test(value)
                },
                message: 'Email cannot contain single quotes or double quotes',
            },
            {
                validator: function (value) {
                    return /^[A-Za-z]/.test(value)
                },
                message: 'Email must start with a letter',
            },
        ],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: [6, 'Password must be at least 6 characters'],
        match: [/^[^'"]+$/, 'Password cannot contain single quotes or double quotes'],
    },
})

UserSchema.pre('save', async function() {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

// UserSchema.methods.getName = function () {
//     return this.name
// }

UserSchema.methods.createJWT = function () {
    return jwt.sign(
        { userId: this._id, name: this.name }, 
        process.env.SESSION_SECRET, 
        {
            expiresIn: process.env.JWT_LIFETIME,
        }
    )
}

UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return isMatch
}

module.exports = mongoose.model('User', UserSchema)