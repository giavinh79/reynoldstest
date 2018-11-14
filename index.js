const app = require('express')(); //dependencies and modules
const http = require('http').Server(app);
const cookieParser = require('cookie-parser');
const fs = require('fs'); // bring in the file system api
const mustache = require('mustache'); //{{}}
const MongoClient = require('mongodb').MongoClient;
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
      // console.log("Attempting login...");
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
    console.log(req);
    // res.send(loggedin.html);
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

http.listen(PORT, function(){
    console.log('listening on localhost:8080');
});