require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;


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

mongoose.connect('mongodb://127.0.0.1:27017/usersDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/secrets', (req, res) => {
    try {
        console.log(req.isAuthenticated());
        if (req.isAuthenticated()) {
            res.render('secrets');
        } else {
            res.render('login');
        }
    } catch (error) {
        console.log(error);
    }
});


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
        const user = new User({ username: req.body.username, password: req.body.password });
        req.logIn(user, (err) => {
            if (err) {
                console.error(err);
            } else {
                res.redirect('/secrets');
            }
        });
    } catch (err) {
        console.error(err);
    }

});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});


app.listen(3000, () => {
    console.log('listening on port 3000');
});
