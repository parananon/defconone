/*jslint node: true */
"use strict";

// #####  ###### #####  ###### #    # #####  ###### #    #  ####  # ######  ####  
// #    # #      #    # #      ##   # #    # #      ##   # #    # # #      #      
// #    # #####  #    # #####  # #  # #    # #####  # #  # #      # #####   ####  
// #    # #      #####  #      #  # # #    # #      #  # # #      # #           # 
// #    # #      #      #      #   ## #    # #      #   ## #    # # #      #    # 
// #####  ###### #      ###### #    # #####  ###### #    #  ####  # ######  ####  
                                                                                


var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var alert = require('./routes/alert');
var crisis = require('./routes/crisis');
var config = require('./config.js');
var http = require('http');
var path = require('path');
var express = require('express');
var app = express();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BSON = require('mongodb').BSONPure;
var messages = require('express-messages-bootstrap');
var flash = require('connect-flash');
var SALT_WORK_FACTOR = 12;
var util = require("util");
var Client = require('telapi').client;
var client = new Client(process.env.TELAPI_SID, process.env.TELAPI_TOKEN2);
var SendGrid = require('sendgrid').SendGrid;
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var nphone = require('phone-formatter');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(flash());
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);


                                                         
// #    #  ####  #    #  ####   ####   ####   ####  ###### 
// ##  ## #    # ##   # #    # #    # #    # #      #      
// # ## # #    # # #  # #      #    # #    #  ####  #####  
// #    # #    # #  # # #  ### #    # #    #      # #      
// #    # #    # #   ## #    # #    # #    # #    # #      
// #    #  ####  #    #  ####   ####   ####   ####  ###### 
                                                         


mongoose.connect(process.env.MONGOLAB_URI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('Connected to DB');
});

var contactSchema = mongoose.Schema({
        fname: { type: String, required: true, unique: false },
        lname: { type: String, required: true, unique: false },
        email: { type: String, required: false, unique: false },
        phone: { type: String, required: false, unique: false }
    });

var userSchema = mongoose.Schema({
        contacts: [contactSchema],
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true},
        name: { type: String, required: true},
        pemail: { type: String, required: true, unique: true}
    });

userSchema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) { return next(); }

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) { return next(err); }

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) { return cb(err); }
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', userSchema);
var Contact = mongoose.model('Contact', contactSchema);
 
// ######  ######  ######  
// #     # #     # #     # 
// #     # #     # #     # 
// ######  ######  ######  
// #     # #   #   #     # 
// #     # #    #  #     # 
// ######  #     # ######  
                         

app.post('/crisis', function (req, res) {
    crisis.send(req, res);
});

app.post('/alert', function (req, res) {
    alert.send(req, res);
});
                                                   
// #    #  ####  ##### #      # #    # ######  ####  
// #    # #    #   #   #      # ##   # #      #      
// ###### #    #   #   #      # # #  # #####   ####  
// #    # #    #   #   #      # #  # # #           # 
// #    # #    #   #   #      # #   ## #      #    # 
// #    #  ####    #   ###### # #    # ######  ####  
                                                   


app.get('/hotlines/hl', function (req, res) {
    var hotline = req.param('radios', null);
    if (hotline === 'suicide') {
        res.redirect('http://imalive.org');
    }
});

// sign up
app.post('/signup', function (req, res) {
    var username = req.param('username', null), password = req.param('password', null), realname = req.param('realname', null),
        pemail = req.param('pemail', null), user = new User({ username: username, password: password, name: realname, pemail: pemail, contacts: []});
    user.save(function (err) {
        if (err) {
            console.log('err');
            req.flash('error', 'Error, user already exists!');
            res.redirect('back');
        } else { console.log('user: ' + user.username + " saved."); req.flash('success', 'User created successfully!'); res.redirect('/signin'); }
    });
});


                                                       
//  ####   ####  #    # #####   ##    ####  #####  ####  
// #    # #    # ##   #   #    #  #  #    #   #   #      
// #      #    # # #  #   #   #    # #        #    ####  
// #      #    # #  # #   #   ###### #        #        # 
// #    # #    # #   ##   #   #    # #    #   #   #    # 
//  ####   ####  #    #   #   #    #  ####    #    ####  
                                                       


app.post('/contacts/add', function (req, res) {
    var fname = req.param('fname', null), lname = req.param('lname', null), email = req.param('email', null),
        phone = nphone.normalize(req.param('phone', null)), user = User.findOne({ username: req.user.username}),
        contact = new Contact({ fname: fname, lname: lname, email: email, phone: phone });
    user.update({ $push: { contacts: contact }});
    req.flash('success', 'Contact added successfully.');
    res.redirect('back');
});

app.get('/contacts/delete/:id', function (req, res) {
    req.user.contacts.id(req.params.id).remove();
    req.user.save();
    req.flash('success', 'Contact removed successfully.');
    res.redirect('back');
});


                                                  
//  ####  ###### ##### ##### # #    #  ####   ####  
// #      #        #     #   # ##   # #    # #      
//  ####  #####    #     #   # # #  # #       ####  
//      # #        #     #   # #  # # #  ###      # 
// #    # #        #     #   # #   ## #    # #    # 
//  ####  ######   #     #   # #    #  ####   ####  
                                                  


app.post('/settings/changepass', function (req, res) {
    var newpass = req.param('newpass', null), newpass2 = req.param('newpass2', null), newcrypt = "";
    user = User.findOne({ username: req.user.username});
    if (newpass === newpass2) {
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) { return err; }

            bcrypt.hash(newpass, salt, function (err, hash) {
                newcrypt = hash;
                if (err) { return err; }
                user.update({$set: {password: newcrypt}});
                req.flash('success', 'Password changed successfully.');
                res.redirect('back');
            });
        });
    } else {
        req.flash('error', 'Passwords do not match.');
        res.redirect('back');
    }
});

app.post('/settings/delete', function (req, res) {
    var uname = req.param('uname', null), vpass = req.param('verifydelete', null);
    if (vpass === req.user.password) {
        User.remove({username: uname});
        req.flash('success', 'Account deleted.');
        res.redirect('/');
    } else {
        req.flash('error', 'Username and password do not match.');
        res.redirect('back');
    }
});


                            
//   ##   #    # ##### #    # 
//  #  #  #    #   #   #    # 
// #    # #    #   #   ###### 
// ###### #    #   #   #    # 
// #    # #    #   #   #    # 
// #    #  ####    #   #    # 
                            


passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    var o_id = new BSON.ObjectID(id);
    User.findOne({_id: o_id}, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { messageE: 'Unknown user ' + username }); }
        user.comparePassword(password, function (err, isMatch) {
            if (err) { return done(err); }
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { messageE: 'Invalid password' });
            }
        });
    });
}));

app.post('/login', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), function (req, res) {
    req.flash('success', 'Signed in successfully. Hello, ' + req.user.username + '!');
    var redirectUrl = '/brb';
    if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl;
        req.session.redirectUrl = null;
    }
    res.redirect(redirectUrl);
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.session.redirectUrl = req.url;
    res.redirect('/signin');
}


                     
//  ####  ###### ##### 
// #    # #        #   
// #      #####    #   
// #  ### #        #   
// #    # #        #   
//  ####  ######   #   

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/users', user.list);
app.get('/alert', ensureAuthenticated, routes.alert);
app.get('/crisis', ensureAuthenticated, routes.crisis);
app.get('/hotlines', routes.hotlines);
app.get('/signup', routes.signup);
app.get('/signin', routes.signin);
app.get('/settings', ensureAuthenticated, routes.settings);
app.get('/contacts', ensureAuthenticated, routes.contacts);
app.get('/logout', routes.logout);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

