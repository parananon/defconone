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
    var suc = true, i = 0, addr, etxt, currentPhone, options;
    for (i; i < req.user.contacts.length; i++) {
        if (req.user.contacts[i].email !== null) {
            addr = req.user.contacts[i].email;
            etxt = config.cemail + req.user.name + ' (via the Defcon One app)';
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
        if (req.user.contacts[i].phone !== null) {
            currentPhone = req.user.contacts[i].phone;
            options = {
                From: process.env.TELAPI_NUMBER,
                To: currentPhone,
                Body: req.user.name + config.csms
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
    if (suc === true) {
        req.flash('success', 'Messages sent successfully.');
        res.redirect('back');
    } else {
        req.flash('error', 'An error occured while sending messages.');
        res.redirect('back');
    }
};