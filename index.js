const app = require('express')(); //dependencies and modules
const http = require('http').Server(app);
// const io = require('socket.io')(http, { wsEngine: 'ws' });
const fs = require('fs'); // bring in the file system api
const mustache = require('mustache'); //{{}}
const MongoClient = require('mongodb').MongoClient;
var clientCount = 0;

const PORT = process.env.PORT || 8080;
//process.env.PORT: convention for Heroku -> if nothing in environ. var then port is 8080

// console.log(__dirname);
app
  .get('/', (req, res) => res.sendFile(__dirname + '/index.html'))
  .get('/css/home.css', (req, res) => res.sendFile(__dirname + '/css/home.css'));
//   .get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
//   })

const bodyParser = require('body-parser'); // Necessary to get form data with Express
app.use(bodyParser.urlencoded({ extended: true }));

var url = "mongodb://superadmin:reynoldssuperadmin5@ds123084.mlab.com:23084/reynoldsdb";
app.post('/database', function(req, res) {
  // var url = "mongodb://superadmin:reynoldssuperadmin5@ds123084.mlab.com:23084/reynoldsdb"
  MongoClient.connect(url, function(err, db) {
    var dbo = db.db("chatclient");
    var query = { user: req.body.user };
    console.log("Attempting login...");
    dbo.collection("accounts").find(query).toArray(function(err, result) {
      if (err) throw err;
      if (result == null || result == "") {
        console.log("Incorrect credentials");
        var fail = {
          message: "Incorrect credentials!"
        };
        fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
          if (err) throw err;
          var html = mustache.to_html(data, fail);
          res.send(html);
        });
      } else {
        if (result[0].pass == req.body.pwd) {
          console.log("Successful login");

          var account = {
            accountname: req.body.user
          };

          fs.readFile(__dirname + '/loggedin.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, account); //template system used to generate dynamic HTML
            res.send(html);
          });

        } else {
          console.log("Incorrect credentials");
          var fail = {
            message: "Incorrect credentials!"
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

http.listen(PORT, function(){
    console.log('listening on localhost:8080');
  });