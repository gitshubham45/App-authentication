require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

mongoose.set('strictQuery', true);

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little  secret.",
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/usersDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
});


app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    }
);


app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('secrets');
    }
    else {
        res.render('login');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/secrets', (req, res) => {
    User.find({ "secret": { $ne: null } })
        .then((users) => {
            res.render('secrets', { usersWithSecret: users });
        }).catch((err) => {
            console.error(err);
        })
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login")
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    // session saves user data in request
    console.log(req.user);
    //res.send(req);
    console.log(req.user.id);
    User.findOne({ _id: req.user._id })
        .then((foundUser) => {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(() => {
                    res.redirect("/secrets");
                });
            }
        }).catch((error) => {
            console.log(error);
        })
})


app.post('/register', async (req, res) => {
    try {
        const user = new User({ username: req.body.username });
        await User.register(user, req.body.password);
        req.logIn(user, function (err) {
            if (err) {
                console.error(err);
                res.redirect('/register');
            } else {
                console.log(req.isAuthenticated());
                res.redirect('/secrets');
            }
        });
    } catch (error) {
        console.error(error);
        res.redirect('/register');
    }
});


app.post('/login', async (req, res) => {

    try {
        if (req.isAuthenticated()) {
            request.render('secrets');
        }
        else {
            const user = new User({ username: req.body.username, password: req.body.password });
            req.logIn(user, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    res.redirect('/secrets');
                }
            });
        }
    } catch (err) {
        console.error(err);
    }

});

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});


app.listen(3000, () => {
    console.log('listening on port 3000');
});
