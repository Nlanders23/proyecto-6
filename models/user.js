const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    genre: {
        type: String,
    },
    age: {
        type: Number,
        required: true
    },
    timestamps: true
})  

const User = mongoose.model('User', UserSchema);
module.exports = User;