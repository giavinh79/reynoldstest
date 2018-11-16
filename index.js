const app = require('express')(); //dependencies and modules
const http = require('http').Server(app);
const cookieParser = require('cookie-parser');
const fs = require('fs'); // bring in the file system api
const mustache = require('mustache'); //{{}}
const MongoClient = require('mongodb').MongoClient;
const previewEmail = require('preview-email');
const nodemailer = require('nodemailer');

app.use(cookieParser("375025"));
app.use(function(req, res, next) { //CORS
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})


const PORT = process.env.PORT || 8080;
//process.env.PORT: convention for Heroku -> if nothing in environ. var then port is 8080

app
  .get('/', (req, res) => res.sendFile(__dirname + '/index.html'))
  .get('/css/home.css', (req, res) => res.sendFile(__dirname + '/css/home.css'))
  .get('/css/loggedin.css', (req, res) => res.sendFile(__dirname + '/css/loggedin.css'))
  .get('/settings.html', (req, res) => res.sendFile(__dirname + '/settings.html'))
  .get('/css/settings.css', (req, res) => res.sendFile(__dirname + '/css/settings.css'))
  .get('/css/signup.css', (req, res) => res.sendFile(__dirname + '/css/signup.css'));
//   .get('/loggedin.html', (req, res) => res.sendFile(__dirname + '/loggedin.html'));
//   .get('/loggedin.html', (req, res) => res.sendFile(__dirname + '/loggedin.html'));
//   .get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
//   })

const bodyParser = require('body-parser'); // Necessary to get form data with Express
app.use(bodyParser.urlencoded({ extended: true }));

var url = "mongodb://superadmin:reynoldssuperadmin5@ds123084.mlab.com:23084/reynoldsdb";
app.post('/login', function(req, res) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    var dbo = db.db("reynoldsdb");
    var query = { user: req.body.username };
    // console.log("Attempting login...");
    dbo.collection("accounts").find(query).toArray(function(err, result) {
      if (err) throw err;
      if (result == null || result == "") {
        var fail = {
          message: "Invalid login"
        };

        var cookieOptions = {
            maxAge: 1000 * 60 * 2, // would expire after 2 minutes
            httpOnly: false, // true: The cookie only accessible by the web server
            signed: false// Signed: Cookie has a signature to show if user manually changed it
        }
        res.cookie('invalidLogin', req.body.username, cookieOptions);

        fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
          if (err) throw err;
          var html = mustache.to_html(data, fail);
          res.send(html);
        });
      } else {
            if (result[0].pass == req.body.password) {
                var account = {
                    accountname: req.body.user
                };

                var cookieOptions = {
                    maxAge: 1000 * 60 * 120, // would expire after 2 hours (120 minutes)
                    httpOnly: true, // true: The cookie only accessible by the web server
                    signed: true // Signed: Cookie has a signature to show if user manually changed it
                }
                res.cookie('activeUser', result[0].verificationCode, cookieOptions);
                fs.readFile(__dirname + '/loggedin.html', 'utf8', (err, data) => {
                    if (err) throw err;
                    var html = mustache.to_html(data, account); //template system used to generate dynamic HTML
                    res.send(html);
                });

            } else {
                var fail = {
                    message: "Invalid login"
                };

                var cookieOptions = {
                    maxAge: 1000 * 60 * 2, // would expire after 2 minutes
                    httpOnly: false, // The cookie only accessible by the web server
                    signed: false // Signed: Cookie has a signature to show if user manually changed it
                }
                res.cookie('invalidLogin', req.body.username, cookieOptions);

                fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
                    if (err) throw err;
                    var html = mustache.to_html(data, fail);
                    res.send(html);
                });
            }
      }
      db.close();
    });
  });
});

app.post('/signup', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      var dbo = db.db("reynoldsdb");
      var query = { code: req.body.text };
      dbo.collection("verificationCodes").find(query).toArray(function(err, result) {
        if (err) throw err;
        if (result == null || result == "") {
          var fail = {
            messageTwo: "Invalid verification code."
          };

          fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, fail);
            res.send(html);
          });
        } else {
              if (result[0].active == 't') {
                var account = {
                    userCode: result[0].code,
                    userEmail: result[0].email
                };
                fs.readFile(__dirname + '/signup.html', 'utf8', (err, data) => {
                    if (err) throw err;
                    var html = mustache.to_html(data, account); //template system used to generate dynamic HTML
                    res.send(html);
                });

              } else {
                  var fail = {
                      messageTwo: "Invalid verification code."
                  };

                  fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
                      if (err) throw err;
                      var html = mustache.to_html(data, fail);
                      res.send(html);
                  });
              }
        }
        db.close();
      });
    });
});

app.post('/registerAccount', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("reynoldsdb");
        var myobj = { user: req.body.inputEmail, pass: req.body.inputPassword1, firstName: req.body.firstName, lastName: req.body.lastName, super: 0, verificationCode: req.body.inputCode};
        dbo.collection("accounts").insertOne(myobj, function(err, res)
        {
            if (err) throw err;
            if (!err) console.log("Account successfully created.");
        });
        var success = {
            messageTwo: "Account successfully created."
        };

        var query = { code: req.body.inputCode };
        var newvalues = { $set: {active: "f" } };
        dbo.collection("verificationCodes").updateOne(query, newvalues, function(err, res) {
            if (err) throw err;
        });
        fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, success);
            db.close();
            res.send(html);
        });
      });
});

app.post('/verifyuser', function(req, res) {
    if (req.signedCookies.activeUser == null)
    {
        res.end('{"error" : "Invalid User", "status" : 401}');
    }
    else
    {
        res.end('{"success" : "Valid User", "status" : 200}');
    }
});

app.post('/email', function(req, res) {

  var api_key = '73e812f6eef0659edade14aa0199a6df-9525e19d-fbd4c6ba';
  var domain = 'sandbox247382c0af194dee852b5c74afeca012.mailgun.org';
  var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
  var VarCode;

  function makeId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  function sendEmail() {
    var message = '<h3>Welcome to the Admin Team!<br></br></h3><p>You have been invited to join the SOCS Reynolds Admin Team. </p><span>Use your Verification Code: "' + VarCode + '" at our website: </span><a href="http://www.socsreynolds.site">Reynolds Board</a><p><br></br>From,<br></br>The Admin Team</p>';
    var smtpTransport = require('nodemailer-smtp-transport');

    var transport = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'blessstylesocs@gmail.com',
        pass: 'Reynolds123'
      }
    }));

    const data = {
      from: 'blessstylesocs@gmail.com',
      to: req.body.email,
      subject: 'Admin Invitation',
      html: '<p>'+ message + '</p>'
    };

    transport.sendMail(data).then(console.log).catch(console.error);
    console.log("Email Sent");
    var message = {
        message: "Invitation Sent"
    };
    fs.readFile(__dirname + '/settings.html', 'utf8', (err, data) => {
        if (err) throw err;
        var html = mustache.to_html(data, message);
        res.send(html);
    });
  }
  function addCodeToDatabase() {
    //check if varCode exists
    MongoClient.connect(url, function(err, db) {
      var exists;
      var dbo = db.db("reynoldsdb");
      do {
        console.log("Generating Code..");
        VarCode = makeId();
        var query = { code: VarCode };
        dbo.collection("verificationCodes").find(query).toArray(function(err, result) {
          if (err) throw err;
          if (result == null || result == "") {
            exists = false;
          } else {
            exists = true;
          }
          db.close();
        });
      } while (exists)

      var codeObj = { code: VarCode, active: "t", email: req.body.email };
      dbo.collection("verificationCodes").insertOne(codeObj, function(err, res) {
        if (err) throw err;
        console.log("verification Code added");
        sendEmail();
        db.close();
      });
    });
  }

  //check if email is already in use
  MongoClient.connect(url, function(err, db) {
    var dbo = db.db("reynoldsdb");
    VarCode = makeId();
    var query = { user: req.body.email };
    dbo.collection("accounts").find(query).toArray(function(err, result) {
      if (err) throw err;
      if (result == null || result == "") {
        addCodeToDatabase();
      } else {
        console.log("Email already in use");
        var message = {
            message: "This Email is already being used by another account"
        };
        fs.readFile(__dirname + '/settings.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, message);
            res.send(html);
        });
      }
      db.close();
    });
  });
});

http.listen(PORT, function(){
    console.log('listening on localhost:8080');
});
