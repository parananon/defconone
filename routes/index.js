/*jslint node: true */
"use strict";

exports.index = function (req, res) {
    res.render('index', { title: "Home", messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.about = function (req, res) {
    res.render('about', { title: 'About', messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.alert = function (req, res) {
    res.render('alert', { title: "Alert", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.crisis = function (req, res) {
    res.render('crisis', { title: "Crisis", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.hotlines = function (req, res) {
	res.render('hotlines', { title: 'Hotlines' });
};

exports.signup = function (req, res) {
	res.render('signup', { title: "Sign Up", messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.signin = function (req, res) {
	res.render('signin', { title: 'Sign In', messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.settings = function (req, res) {
	res.render('settings', { title: "Settings", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.contacts = function (req, res) {
	res.render('contacts', { title: "Contacts", user: req.user, messageE: req.flash('error'), messageI: req.flash('info'), messageS: req.flash('success') });
};

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};
