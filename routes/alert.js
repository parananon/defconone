/*jslint node: true */
/*jslint plusplus: true */
"use strict";

var util = require("util");
var Client = require('telapi').client;
var client = new Client(process.env.TELAPI_SID, process.env.TELAPI_TOKEN2);
var config = require('../config.js');
var SendGrid = require('sendgrid').SendGrid;
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

exports.send = function (req, res) {
    var action = req.param('action', null), suc = true, i = 0, j = 0, currentPhone, options, addr, etxt, sendto, contact, newContacts = [];
    sendto = Object.keys(req.body);
    sendto.splice(-2, 2);
    for (j; j < sendto.length; j++) {
        contact = req.user.contacts.id(sendto[j]);
        newContacts.push(contact);
    }
    if (action === 'sms') { //send text messages
        if (sendto.length <= 0) {
            for (i; i < req.user.contacts.length; i++) {
                if (req.user.contacts[i].phone !== null) {
                    currentPhone = req.user.contacts[i].phone;
                    options = {
                        From: process.env.TELAPI_NUMBER,
                        To: currentPhone,
                        Body: req.user.name + config.sms
                    };
                    client.create("sms_messages", options,
                        function (response) {
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
        } else {
            for (i; i < newContacts.length; i++) {
                if (newContacts[i].phone !== null) {
                    currentPhone = newContacts[i].phone;
                    options = {
                        From: process.env.TELAPI_NUMBER,
                        To: currentPhone,
                        Body: req.user.name + config.sms
                    };
                    client.create("sms_messages", options,
                        function (response) {
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
        }
    } else { //otherwise, send emails
        if (sendto.length <= 0) {
            for (i; i < req.user.contacts.length; i++) {
                if (req.user.contacts[i].email !== null) {
                    addr = req.user.contacts[i].email;
                    etxt = 'Email ' + req.user.name + config.email;
                    sendgrid.send({
                        to: addr,
                        fromname: "Defcon One",
                        from: process.env.SENDGRID_USERNAME,
                        subject: 'Emergency! ' + req.user.name + ' needs your help',
                        text: etxt
                    }, function (success, message) {
                        if (!success) {
                            console.log(message);
                            suc = false;
                        } else {
                            console.log(message);
                            suc = true;
                        }
                    });
                }
            }
        } else {
            for (i; i < newContacts.length; i++) {
                if (newContacts[i].email !== null) {
                    addr = newContacts[i].email;
                    etxt = 'Email ' + req.user.name + config.email;
                    sendgrid.send({
                        to: addr,
                        fromname: "Defcon One",
                        from: process.env.SENDGRID_USERNAME,
                        subject: 'Emergency! ' + req.user.name + ' needs your help',
                        text: etxt
                    }, function (success, message) {
                        if (!success) {
                            console.log(message);
                            suc = false;
                        } else {
                            console.log(message);
                            suc = true;
                        }
                    });
                }
            }
        }
    }
    if (suc === true) {
        req.flash('success', 'Messages sent successfully.');
        res.redirect('back');
    } else {
        req.flash('error', 'An error occured while sending messages.');
        res.redirect('back');
    }
};