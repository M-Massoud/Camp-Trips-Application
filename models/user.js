const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const User = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);