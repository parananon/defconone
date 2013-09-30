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