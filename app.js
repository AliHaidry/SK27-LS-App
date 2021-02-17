
/**Express is the most popular Node web framework, and is the underlying library for a number of other popular Node web frameworks. 
 * It provides mechanisms to:

Write handlers for requests with different HTTP verbs at different URL paths (routes).
Integrate with "view" rendering engines in order to generate responses by inserting data into templates.
Set common web application settings like the port to use for connecting, and the location of templates that are used for rendering the response.
Add additional request processing "middleware" at any point within the request handling pipeline. */
const express = require('express');

/**  To store or access session data, simply use the request property req. session , which is (generally) serialized as JSON by the store, so nested objects are typically fine. */
const session = require('express-session');

/** Handlebars: a lightweight templating system for Node. 
 * Handlebars allows us to avoid repetitive code by compiling the final DOM structure of our site via logic, 
 * typically compiled by task runners such as Grunt or Gulp. */
const hbs = require('express-handlebars');


/** Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. 
 * It manages relationships between data, provides schema validation, 
 * and is used to translate between objects in code and the representation of those objects in MongoDB. */
const mongoose = require('mongoose');



/** Passport is authentication middleware for Node.js. Extremely flexible and modular, 
 * Passport can be unobtrusively dropped in to any Express-based web application. 
 * A comprehensive set of strategies support authentication using a username and password, Facebook, Twitter, and more. */
const passport = require('passport');


/** Passport strategy for authenticating with a username and password.

This module lets you authenticate using a username and password in your Node.js applications. 
By plugging into Passport, local authentication can be easily and unobtrusively integrated into any application or 
framework that supports Connect-style middleware, including Express. */
const localStrategy = require('passport-local').Strategy; 

/** A library to help you hash passwords. */
const bcrypt = require('bcrypt');

/** Setting the app */
const app = express();

/** Setting the database locally */
mongoose.connect("mongodb://localhost:27017/loginsystem", {
   useNewUrlParser: true,
   useUnifiedTopology: true 
});


/** Setting the user schema */
const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
});

const User = mongoose.model('User',UserSchema);

/** Setting the middleware */
app.engine('hbs', hbs({extname:'.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public')); // refers to the public folder.
app.use(session({
    secret: "verygoodsecret",
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/** Setting the Passport.js */
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id)
});

passport.deserializeUser(function (id, done) {
    // Setup user model
    User.findById(id, function (err, user) {
        done(err, user);
    })
});

/** Implementation of the strategy */
passport.use(new localStrategy(function(username, password, done) {
    User.findOne({username: username}, function (err, user){
        if(err) {
            return done(err);
        }
        if(!user) {
            return done(null, false, {message: 'Incorrect Username.'});
        }

        bcrypt.compare(password, user.password, function (err,res){
            if(err) {
                return done(err);
            }
            if (res === false) {
                return done (null, false, {message: 'Incorrect Password.'});
            }
            return done(null,user);
        });
    });
}));


// login logic with function.
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/login');
}


// logout logic with function.
function isLoggedOut(req, res, next){
    if(!req.isAuthenticated()) return next();
    res.redirect('/');
}




app.post('/login', passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/login?error=true'
}));


app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


// Setup our admin user.
app.get('/setup', async (req, res) =>{
    const exists = await User.exists({username:"admin"});
    
    if(exists){
        res.redirect('/login');
        return;
    }

    bcrypt.genSalt(10, function (err, salt){
        if(err) return next(err);
        bcrypt.hash("pass", salt, function (err, hash){
            if(err) return next(err);

            const newAdmin = new User({
                username: "admin",
                password: hash
            });

            newAdmin.save();

            res.redirect('/login');
        })
    })
});



/** Setting up the routes */
// req -> request 
// res -> response
app.get('/', isLoggedIn,  (req, res)=>{
    res.render("index", {title:"Home"});
});

app.get('/login', isLoggedOut, (req, res)=>{
    const response = {
        title: "Login",
        error: req.query.error
    }


    res.render("login", response);
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
}); 