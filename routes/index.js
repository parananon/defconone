
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.about = function(req, res){
    res.render('about', { title: 'About' });
};

exports.email = function(req, res){
	res.render('email', { title: 'Send an email' });
};

exports.brb = function(req, res){
	res.render('brb', { title: 'Big Red Button' });
};

exports.hotlines = function(req, res){
	res.render('hotlines', { title: 'Hotlines' });
};

exports.signup = function(req, res){
	res.render('signup', { title: 'Sign Up' });
}

exports.signin = function(req, res){
	res.render('signin', { title: 'Sign In' });
}

exports.settings = function(req, res){
	res.render('settings', { title: 'Settings' });
}