const mongoose = require('mongoose');
const Review = require('../models/reviews');

const Camp = require('../models/camps');
mongoose.connect('mongodb://localhost:27017/yelpcampdb', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO ERROR!!!!")
        console.log(err)
    });


const camp2 = new Camp({
    name: 'chicage camp',
    price: 199,
    descripton: 'best camp in chicago',
    location: 'chicago'
})

// camp2.save();


const camp3 = new Camp({
    name: 'newyork camp',
    price: 199,
    descripton: 'best camp in new york',
    location: 'new york'
})
// camp3.save();

// const camp5 = new Camp({
//     name: ' London camp',
//     price: 499,
//     descripton: 'best camp in uk',
//     location: 'London'
// })

// camp5.save();

// const nycamp = new Camp({
//     name: 'ny camp',
//     price: 99,
//     descripton: 'best camp in ny',
//     location: 'new york'
// })
// Camp.insertMany([camp4, nycamp])

const review1 = new Review({
    rate: 2,
    review: 'da3eef gdn'
});
// review1.save();

const review2 = new Review({
    rate: 2,
    review: 'da3eef gdn a3teeloo etneen mn ashra'
});


const camp6565 = new Camp({
    name: 'newyork camp',
    price: 199,
    descripton: 'best camp in new york',
    location: 'new york',
    author: '619206562bec0773093c47a9'

})
// camp6565.save();


// const camp10 = new Camp({
//     name: 'the new camp camp',
//     price: 899,
//     descripton: 'best camp in everrrrrrrrr',
//     location: 'new jersey',
// })