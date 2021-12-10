const mongoose = require('mongoose');
const Review = require('./reviews');
// const User = require('./user');


// //////////////////////////// the camp schema ////////////////////////

const campschema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    descripton: String,
    location: String,

    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});


campschema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})


const Camp = mongoose.model('Camp', campschema);

module.exports = Camp;