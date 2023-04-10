const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://127.0.0.1:27017/usersDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = new User({
            email: req.body.username,
            password: hashedPassword
        });
        await newUser.save();
        res.render('secrets');
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.username });
        if (!user) {
            res.render('home', { error: 'Invalid email or password.' });
            return;
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (isMatch) {
            res.render('secrets');
        } else {
            res.render('home', { error: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error(err);
        res.send(err);
    }
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
