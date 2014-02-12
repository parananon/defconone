// #####  ###### #####  ###### #    # #####  ###### #    #  ####  # ######  ####  
// #    # #      #    # #      ##   # #    # #      ##   # #    # # #      #      
// #    # #####  #    # #####  # #  # #    # #####  # #  # #      # #####   ####  
// #    # #      #####  #      #  # # #    # #      #  # # #      # #           # 
// #    # #      #      #      #   ## #    # #      #   ## #    # # #      #    # 
// #####  ###### #      ###### #    # #####  ###### #    #  ####  # ######  ####  
                                                                                


var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var SendGrid = require('sendgrid').SendGrid;
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
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
var nphone = require('phone-formatter');
var Client = require('telapi').client;
var client = new Client(process.env.TELAPI_SID, process.env.TELAPI_TOKEN2);
var config = require('./config.js');

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
var Contact = mongoose.model('Contact', contactSchema);
 
// ######  ######  ######  
// #     # #     # #     # 
// #     # #     # #     # 
// ######  ######  ######  
// #     # #   #   #     # 
// #     # #    #  #     # 
// ######  #     # ######  
                         

app.post('/brb/email', function(req, res){
  var suc = true;
  var crisis = req.param('crisis', null);
  for(var i = 0; i < req.user.contacts.length; i++){
    if(req.user.contacts[i].email != null){
      var addr = req.user.contacts[i].email;
      var etxt = 'Email ' + req.user.name + config.email;
      if(crisis=="true"){
        etxt = config.cemail + req.user.name + ' (via the Defcon One app)';
      }
      sendgrid.send({
          to: addr,
          fromname: "Defcon One",
          from: process.env.SENDGRID_USERNAME,
          subject: 'Emergency! ' + req.user.name + ' needs your help',
          text: etxt}, function(success, message) {
      if (!success) {
        console.log(message);
        suc = false;
      }
      else
        console.log(message);
        suc = true;
      });
    }
  }
  if(suc == true) {
    req.flash('success', 'Emails sent successfully.');
    res.redirect('back');
  }
  else {
    req.flash('error', 'An error occured while sending emails.');
    res.redirect('back');
  }
});

app.post('/brb/sms', function(req, res){
  var crisis = req.param('crisis', null);
  var suc = true;
	for(var i = 0; i < req.user.contacts.length; i++){
    if(req.user.contacts[i].phone != null){
      var currentPhone = req.user.contacts[i].phone;
      var options = {
    	    From: process.env.TELAPI_NUMBER,
    	    To: currentPhone,
          Body: req.user.name + config.sms
    	};
      if(crisis=="true"){
        options.Body = req.user.name + config.csms;
      }
      client.create("sms_messages", options, function (response) {
    	        util.log("SmsMessage SID: " +  response.sid);
              suc = true;
    	    },
    	    function (error) {
    	        util.log("Error: " + error);
              suc = false;
    	    }
    	);
    }
  }
  if(suc == true) {
    req.flash('success', 'Text messages sent successfully.');
    res.redirect('back');
  }
  else {
    req.flash('error', 'An error occured while sending text messages.');
    res.redirect('back');
  }
});


                                                   
// #    #  ####  ##### #      # #    # ######  ####  
// #    # #    #   #   #      # ##   # #      #      
// ###### #    #   #   #      # # #  # #####   ####  
// #    # #    #   #   #      # #  # # #           # 
// #    # #    #   #   #      # #   ## #      #    # 
// #    #  ####    #   ###### # #    # ######  ####  
                                                   


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
  var user = new User({ username: username, password: password, name: realname, pemail: pemail, contacts: []});
  user.save(function(err) {
    if(err) { console.log('err'); req.flash('error', 'Error, user already exists!'); res.redirect('back');}
    else { console.log('user: ' + user.username + " saved."); req.flash('success', 'User created successfully!'); res.redirect('/signin');}
  });
})


                                                       
//  ####   ####  #    # #####   ##    ####  #####  ####  
// #    # #    # ##   #   #    #  #  #    #   #   #      
// #      #    # # #  #   #   #    # #        #    ####  
// #      #    # #  # #   #   ###### #        #        # 
// #    # #    # #   ##   #   #    # #    #   #   #    # 
//  ####   ####  #    #   #   #    #  ####    #    ####  
                                                       


app.post('/contacts/add', function (req, res) {
  var fname = req.param('fname', null);
  var lname = req.param('lname', null);
  var email = req.param('email', null);
  var phone = nphone.normalize(req.param('phone', null));
  user = User.findOne({ username: req.user.username});
  var contact = new Contact({ fname:fname, lname:lname, email:email, phone:phone });
  user.update({ $push: { contacts: contact }});
  req.flash('success', 'Contact added successfully.');
  res.redirect('back');
})

app.get('/contacts/delete/:id', function (req, res) {
  req.user.contacts.id(req.params.id).remove();
  req.user.save();
  req.flash('success', 'Contact removed successfully.');
  res.redirect('back');
})


                                                  
//  ####  ###### ##### ##### # #    #  ####   ####  
// #      #        #     #   # ##   # #    # #      
//  ####  #####    #     #   # # #  # #       ####  
//      # #        #     #   # #  # # #  ###      # 
// #    # #        #     #   # #   ## #    # #    # 
//  ####  ######   #     #   # #    #  ####   ####  
                                                  


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


                            
//   ##   #    # ##### #    # 
//  #  #  #    #   #   #    # 
// #    # #    #   #   ###### 
// ###### #    #   #   #    # 
// #    # #    #   #   #    # 
// #    #  ####    #   #    # 
                            


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


                     
//  ####  ###### ##### 
// #    # #        #   
// #      #####    #   
// #  ### #        #   
// #    # #        #   
//  ####  ######   #   
                     


app.get('/brb', ensureAuthenticated, function(req, res){
  res.render('brb', { title: "Big Red Button", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/settings', ensureAuthenticated, function(req, res){
  res.render('settings', { title: "Settings", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/contacts', ensureAuthenticated, function(req, res){
  res.render('contacts', { title: "Contacts", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/signup', function(req, res){
  res.render('signup', { title: "Sign Ip", messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/signin', function(req, res){
  res.render('signin', { title: "Sign In", messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
});

app.get('/', function(req, res){
  res.render('index', { title: "Home", messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
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
app.get('/contacts', routes.contacts);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

