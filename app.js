
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var SendGrid = require('sendgrid').SendGrid;
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var express = require('express');
var app = express();
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BSON = require('mongodb').BSONPure;
var messages = require('express-messages-bootstrap');
var flash = require('connect-flash');
var SALT_WORK_FACTOR = 12;

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

mongoose.connect(process.env.MONGOLAB_URI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
  console.log('Connected to DB');
});

// Mongoose
var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  name: { type: String, required: true},
  pemail: { type: String, required: true, unique: true}, //personal email address
  phone: { type: Array, required: false, unique: false },
  email: { type: Array, required: false, unique: false }
});

userSchema.pre('save', function(next) {
  var user = this;

  if(!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if(err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
      if(err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err) return cb(err);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);

// <brb>
app.post('/brb/email', function(req, res){
  for(var i = 0; i < req.user.email.length; i++){
    var addr = req.user.email[i];
  	sendgrid.send({
   	to: addr,
    from: process.env.SENDGRID_USERNAME,
    subject: ' ' + req.user.name + ' needs your help',
    text: 'Email ' + req.user.name + ' now to let them know you\'re there for them. \n\n- Defcon One (http://defconone.us)'
  }, function(success, message) {
    if (!success) {
      console.log(message);
      req.flash('success', 'Emails sent successfully.');
      res.redirect('back');
    }
    else
      req.flash('error', 'An error occured while sending emails.');
      res.redirect('back');
  });
  }
});

app.post('/brb/sms', function(req, res){
	var sms = req.param('sms', null);
	for(var i = 0; i < req.user.phone.length; i++){
    var currentPhone = req.user.phone[i];
    var util = require("util");
  	var Client = require('telapi').client;

  	var client = new Client(process.env.TELAPI_SID, process.env.TELAPI_TOKEN2); 

  	var options = {
  	    "From": process.env.TELAPI_NUMBER,
  	    "To": currentPhone,
  	    "Body": "Emergency! " + req.user.name + " needs your help. Text them to let them know you\'re there for them. \n- Defcon One \n(http://www.defconone.us)"
  	};


  	client.create("sms_messages", options, function (response) {
  	        util.log("SmsMessage SID: " +  response.sid);
            req.flash('success', 'Text messages sent successfully.');
            res.redirect('back');
  	    },
  	    function (error) {
  	        util.log("Error: " + error);
            req.flash('error', 'An error occured while sending text messages.');
            res.redirect('back');
  	    }
  	);
  }
});

// </brb>

// hotlines
app.get('/hotlines/hl', function(req, res){
  var hotline = req.param('radios', null);
  if(hotline == 'suicide'){
    res.redirect('http://imalive.org')
  }
});

// sign up
app.post('/signup', function (req, res) {
  var username = req.param('username', null);
  var password = req.param('password', null);
  var realname = req.param('realname', null);
  var pemail = req.param('pemail', null);
  var user = new User({ username: username, password: password, name: realname, pemail: pemail});
  user.save(function(err) {
    if(err) { console.log('err'); req.flash('error', 'Error, user already exists!'); res.redirect('back');}
    else { console.log('user: ' + user.username + " saved."); req.flash('success', 'User created successfully!'); res.redirect('/signin');}
  });
})

// <settings>

app.post('/settings/changepass', function (req, res) {
  var newpass = req.param('newpass', null);
  var newpass2 = req.param('newpass2', null);
  var newcrypt = "";
  user = User.findOne({ username: req.user.username});
  if(newpass == newpass2){
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if(err) return err;

      bcrypt.hash(newpass, salt, function(err, hash) {
        newcrypt = hash;
        if(err) return err;
        user.update({$set: {password: newcrypt}});
        req.flash('success', 'Password changed successfully.');
        res.redirect('back');
      });
    });
    }
  else{
    req.flash('error', 'Passwords do not match.');
    res.redirect('back');
  }
})

app.post('/settings/delete', function (req, res) {
  var uname = req.param('uname', null);
  var vpass = req.param('verifydelete', null);
  if(vpass == req.user.password){
    User.remove({username:uname});
    req.flash('success', 'Account deleted.');
    res.redirect('/');
  }
  else
    req.flash('error', 'Username and password do not match.');
    res.redirect('back');
})

app.post('/settings/addtel', function (req, res) {
  var newtel = req.param('newtel', null);
  var user = User.findOne({ username: req.user.username });
  user.update({$push: {phone:newtel}});
  req.flash('success', 'Telephone number added to account.');
  res.redirect('back');
})

app.post('/settings/deltel', function (req, res) {
  var tel = req.param('tel', null);
  var user = User.findOne({ username: req.user.username });
  user.update({$pull: {phone:tel}});
  req.flash('info', 'Telephone number removed from account.');
  res.redirect('back');
})

app.post('/settings/addemail', function (req, res) {
  var newmail = req.param('newmail', null);
  var user = User.findOne({ username: req.user.username });
  user.update({$push: {email:newmail}});
  req.flash('success', 'Email address added to account.');
  res.redirect('back');
})

app.post('/settings/delemail', function (req, res) {
  var curmail = req.param('currentmail', null);
  var user = User.findOne({ username: req.user.username });
  user.update({$pull: {email:curmail}});
  req.flash('info', 'Email address removed from account.');
  res.redirect('back');
})

// </settings>

// <auth>
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  var o_id = new BSON.ObjectID(id);
  User.findOne({_id:o_id}, function(err, user){
  	done(err, user);
  })
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { messageE: 'Unknown user ' + username }); }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { messageE: 'Invalid password' });
      }
    });
  });
}));

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }),
  function(req, res) {
    req.flash('success', 'Signed in successfully. Hello, ' + req.user.username + '!');
    var redirectUrl = '/brb';
    if (req.session.redirectUrl) {
      redirectUrl = req.session.redirectUrl;
      req.session.redirectUrl = null;
    }
    res.redirect(redirectUrl);
  }
);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.redirectUrl = req.url;
  res.redirect('/signin');
}

// </auth>

app.get('/brb', ensureAuthenticated, function(req, res){
  res.render('brb', { user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/settings', ensureAuthenticated, function(req, res){
  res.render('settings', { user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/signup', function(req, res){
  res.render('signup', { messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/signin', function(req, res){
  res.render('signin', { messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/', function(req, res){
  res.render('index', { messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/users', user.list);
app.get('/brb', routes.brb);
app.get('/hotlines', routes.hotlines);
app.get('/signup', routes.signup);
app.get('/signin', routes.signin);
app.get('/settings', routes.settings);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

