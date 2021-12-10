if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
};


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
// const ExpressError = require('./utils/ErrorHandler');
const session = require('express-session');
const flash = require('connect-flash');
const Camp = require('./models/camps');
const Review = require('./models/reviews');
const User = require('./models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const multer = require('multer');
const {
    storage
} = require('./cloudinary/cloudinaryApp');
const upload = multer({
    storage
});


const mbxGeocoding = require('./@mapbox/mapbox-sdk/services/Geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({
    accessToken: mapBoxToken
});


const methodOverride = require('method-override');

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");

// 'mongodb://localhost:27017/yelpcampdb'
process.env.dbUrl

mongoose.connect(process.env.dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO ERROR!!!!")
        console.log(err)
    })

app.use(express.static('public'));
app.use(express.static('images'));

app.use(express.urlencoded({
    extended: true
}));

app.use(methodOverride('_method'));

app.use(mongoSanitize());
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);



const sessinoconfigs = {
    secret: 'mysterySecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}

app.use(session(sessinoconfigs));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.currentUser = req.user;

    next();
});


const path = require('path');
const {
    findById
} = require('./models/reviews');
const {
    error
} = require('console');
app.set('views', path.join(__dirname, 'views'))

app.set('view engine', 'ejs');



////////////////////  isAuthenticated middleware /////////////////

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', "You must login first!");
        return res.redirect('/login');
    }
    next();
}

///////////////  is author middleware  /////////////////

const isAuthor = async (req, res, next) => {
    const showCampground = await Camp.findById(req.params.id);
    if (!req.user || !showCampground.author.equals(req.user._id)) {
        req.flash('error', "You don't have the permission to do that")
        return res.redirect('/campgrounds')
    }
    next()
}

//////////////////////////////////////////////////////

///////////////  is review author middleware  /////////////////

const isReviewAuthor = async (req, res, next) => {
    const showReview = await Review.findById(req.params.reviewId);
    if (!req.user || !showReview.author.equals(req.user._id)) {
        req.flash('error', "You don't have the permission to do that")
        return res.redirect('/campgrounds')
    }
    next()
}

//////////////////////////////////////////////////////

///////////////  is admin middleware  /////////////////

const isAdmin = async (req, res, next) => {

    if (req.user && req.user.username === 'admin') {
        const showCampground = await Camp.findById(req.params.id)
        return res.render('editcamp', {
            showCampground
        })
    }
    next()
}

//////////////////////////////////////////////////////

///////////////  is Review admin middleware  /////////////////

const isReviewAdmin = async (req, res, next) => {

    if (req.user.username === 'admin') {
        const campground = await Camp.findByIdAndUpdate(req.params.id, {
            $pull: {
                reviews: req.params.reviewId
            }
        })
        await Review.findByIdAndDelete(req.params.reviewId)
        return res.redirect(`/campgrounds/${campground._id}`)
    }

    next()
}

//////////////////////////////////////////////////////


app.get('/', (req, res) => {
    res.render('home.ejs')
});


app.get('/campgrounds', async (req, res) => {

    const campgrounds = await Camp.find({})
    res.render('campgrounds', {
        campgrounds
    })
});



app.get('/campgrounds/:id', async (req, res) => {
    const showCampground = await Camp.findById(
        req.params.id
    ).populate('reviews').populate('author');
    res.render('show.ejs', {
        showCampground
        //// i would use a res.locals instead so i dont have to pass this in every template
        // message: req.flash('success')
    })
});


//////////// add a new camp //////////


app.get('/newcamp', isLoggedIn, (req, res) => {
    res.render('addNew')
});


app.post('/campgrounds', upload.single("image"), isLoggedIn, async (req, res) => {
    const campground = await new Camp({
        name: req.body.campnameinput,
        image: req.body.image,
        location: req.body.camplocationinput,
        price: req.body.campprice,
        descripton: req.body.campdescription,
        // author: req.user._id
    })
    campground.author = req.user._id

    const geodata =
        await geocoder.forwardGeocode({
            query: req.body.camplocationinput,
            limit: 1
        })
        .send()

    campground.geometry = geodata.body.features[0].geometry

    if (req.file == undefined) {
        await campground.save();
        req.flash('success', 'Success!! you added a new camp');
        res.redirect(`/campgrounds/${campground._id}`)

    } else {
        campground.image = req.file.path
        await campground.save();
        req.flash('success', 'Success!! you added a new camp');
        res.redirect(`/campgrounds/${campground._id}`)
    }
});


///////////////// update camp //////////////////

app.get('/campgrounds/:id/edit', isAdmin, isAuthor, async (req, res) => {
    const showCampground = await Camp.findById(req.params.id)
    res.render('editcamp', {
        showCampground
    })
});


app.put('/campgrounds/:id', async (req, res) => {

    const editCampground = await Camp.findByIdAndUpdate(req.params.id, {
        name: req.body.campnameinput,
        location: req.body.camplocationinput,
        price: req.body.campprice,
        descripton: req.body.campdescription
    });
    res.redirect('/campgrounds')
})


///////////////// DELETE Camp ///////////////////////////////////

// app.delete('/campgrounds/:id', isAdmin, isAuthor, async (req, res) => {

//     await Camp.findByIdAndDelete(req.params.id);

//     res.redirect('/campgrounds')
// })


app.delete('/campgrounds/:id', async (req, res) => {

    const showCampground = await Camp.findById(req.params.id);

    if (req.user && req.user.username === 'admin' || req.user && showCampground.author.equals(req.user._id)) {
        await Camp.findByIdAndDelete(req.params.id);
    } else if (!req.user || !showCampground.author.equals(req.user._id)) {
        req.flash('error', "You don't have the permission to do that")
        return res.redirect('/campgrounds')
    }
    res.redirect('/campgrounds')
})


//////////////////// Camp Reviews /////////////////////


app.get('/campgrounds/:id/reviews', async (req, res) => {
    const campground = await Camp.findById(req.params.id)
    res.redirect(`/campgrounds/${campground._id}`);
})


//////////////////// delete a Review /////////////////////


app.delete('/campgrounds/:id/reviews/:reviewId', isReviewAdmin, isReviewAuthor, async (req, res) => {

    const campground = await Camp.findByIdAndUpdate(req.params.id, {
        $pull: {
            reviews: req.params.reviewId
        }
    })
    await Review.findByIdAndDelete(req.params.reviewId)
    res.redirect(`/campgrounds/${campground._id}`)
})


////// Don't forget async and await /////////

/////////////note
//  make sure to use async and await 


//////////////////// add a Review /////////////////////
app.post('/campgrounds/:id/reviews', isLoggedIn, async (req, res) => {
    const campground = await Camp.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
})


//////////////////////// the authentication routes //////////////

app.get('/register', (req, res) => {
    res.render('register')
});


app.post('/register', async (req, res) => {

    ///////// note //////
    // it should always be req.body.username and req.body.password
    // so make sure this is what on the form fields name as well

    try {
        const user = new User({
            username: req.body.username,
            email: req.body.registeremail
        });
        const registeredUser = await User.register(user, req.body.password);

        req.login(registeredUser, err => {
            if (err) return next(err);

            req.flash('success', 'you registered succefully');
            res.redirect('/campgrounds')
        })
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }
})



////////////// login routes //////////////

app.get('/login', (req, res) => {
    res.render('login')
});



app.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), (req, res) => {
    req.flash('success', 'welcome back');
    const redirectTo = req.session.returnTo || '/campgrounds'
    res.redirect(redirectTo);
})


////////////////// logout routes /////////////

app.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'logged out succefully')
    res.redirect('/campgrounds');
});


////////////////////////////////

////////////////// admin login routes /////////////

app.get('/admin', (req, res) => {
    res.render('adminLogin')
    if (req.body.adminCode === "taha") {
        res.send('an admin is here')
        console.log('you are an admin')
    } else {
        console.log('nooooooooo')
    }
});

////////////////////////////////

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`iam listenning to port ${port} now`)
});


// the 404 route this 

// app.use((req, res) => {
//     res.send('error!! cant find it')
// })

// or 

// app.get('*', (req, res) => {
//     res.send('error!! cant find it')
// })


/// important note ////
// node by default is always looking for the index.js file so 

// require('./cloudinary/index'); 
// require('./cloudinary/'); 

// is exactly the same 