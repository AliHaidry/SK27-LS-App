
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
passport.use(new localStrategy(function(user, password, done) {
    User.findOne({username: user.username}, function (err, user){
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




/** Setting up the routes */
// req -> request 
// res -> response
app.get('/', (req, res)=>{
    res.render("index", {title:"Home"});
});

app.get('/login', (req, res)=>{
    res.render("login", {title:"Login"});
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
}); 