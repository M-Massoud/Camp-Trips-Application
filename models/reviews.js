const mongoose = require('mongoose');
const User = require('./user');

const reviewschema = new mongoose.Schema({
    rate: Number,
    description: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});


const Review = mongoose.model('Review', reviewschema);


module.exports = Review;