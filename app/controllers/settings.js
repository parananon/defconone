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