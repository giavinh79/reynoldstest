const app = require('express')(); //dependencies and modules
// app.enable('trust proxy');
// app.set('trust proxy');
// app.get('trust proxy');
// console.log(app.get('trust proxy'));

const http = require('http').Server(app);
const cookieParser = require('cookie-parser');
const fs = require('fs'); // bring in the file system api
const mustache = require('mustache'); //{{}}
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary');
const multiparty = require('multiparty');

cloudinary.config({
    cloud_name: 'dhwlyljdd',
    api_key: '751525171794449',
    api_secret: 'NHBYucD3tJPm6AOPRa0ZAeptoKc'
});

app.use(cookieParser("375025"));
app.use(function(req, res, next) { //CORS
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

const PORT = process.env.PORT || 80;
//process.env.PORT: convention for Heroku -> if nothing in environ. var then port is 8080

app
  .get('/', (req, res) => res.sendFile(__dirname + '/index.html'))
  .get('/favicon.ico', (req, res) => res.sendFile(__dirname + '/favicon.ico'))
  .get('/create.html', (req, res) => res.sendFile(__dirname + '/create.html'))
  .get('/css/home.css', (req, res) => res.sendFile(__dirname + '/css/home.css'))
  .get('/css/create.css', (req, res) => res.sendFile(__dirname + '/css/create.css'))
  .get('/css/dropzone.css', (req, res) => res.sendFile(__dirname + '/css/dropzone.css'))
  .get('/lib/dropzone.js', (req, res) => res.sendFile(__dirname + '/lib/dropzone.js'))
  .get('/css/loggedin.css', (req, res) => res.sendFile(__dirname + '/css/loggedin.css'))
  .get('/res/CompanyName.png', (req, res) => res.sendFile(__dirname + '/res/CompanyName.png'))
  .get('/loggedin.html', (req, res) => res.sendFile(__dirname + '/loggedin.html'))
  .get('/settings.html', (req, res) => res.sendFile(__dirname + '/settings.html'))
  .get('/css/settings.css', (req, res) => res.sendFile(__dirname + '/css/settings.css'))
  .get('/edit.html', (req, res) => res.sendFile(__dirname + '/edit.html'))
  .get('/css/edit.css', (req, res) => res.sendFile(__dirname + '/css/edit.css'))
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
                    httpOnly: false, // true: The cookie only accessible by the web server
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
    var error = false;
    if (req.body.inputEmail == null || req.body.inputPassword1 == null || req.body.firstName == null)
    {
        error = true;
    }

    function createAccount() {
        var myobj = { user: req.body.inputEmail, pass: req.body.inputPassword1, firstName: req.body.firstName, lastName: req.body.lastName, super: 0, verificationCode: req.body.inputCode};
        dbo.collection("accounts").insertOne(myobj, function(err, res)
        {
            if (err) throw err;
            if (!err) console.log("Account successfully created.");
        });
        db.close();
    }

    function doneCreate() {
        if (error)
        {
            console.log("tf")
            res.redirect('/');
            res.status(404).end();
        }
        else
        {
            createAccount();
            console.log("howtf")

            var success = {
              messageTwo: "Account successfully created."
            };

            fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
                if (err) throw err;
                var html = mustache.to_html(data, success);
                res.send(html);
            });
         }
    }

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("reynoldsdb");

        var query = { code: req.body.inputCode };
        var newvalues = { $set: {active: "f" } };
        dbo.collection("verificationCodes").updateOne(query, newvalues, function(err, res) {
            if (err) return;
            if (res.matchedCount == 0)
            {
                console.log("Invalid verification code inputted during account creation.");
                error = true;
                doneCreate();
            }
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

app.post('/uploadContent', function(req, res) {
    var username= "";
    var adminName = "";
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbo = db.db("reynoldsdb");

        function createContent()
        {
            var myobj = { title: req.body.inputTitle, file: req.body.inputFile, date: req.body.inputDate, duration: req.body.inputDuration, admin: username, firstName: adminName, id: req.body.id};
            dbo.collection("content").insertOne(myobj, function(err, res)
            {
                if (err) throw err;
            });
            console.log("let's go");
            db.close();
            res.redirect('/create.html')
        }
        console.log(req.signedCookies.activeUser);
        var query = { verificationCode: req.signedCookies.activeUser };
        dbo.collection("accounts").find(query).toArray(function(err, result) {
            if (err) throw err;
            if (result == null || result == "") {
                console.log("why the frik");
                var fail = {
                    messageTwo: "Invalid verification code."
                };
                db.close();
                fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
                    if (err) throw err;
                    var html = mustache.to_html(data, fail);
                    res.send(html);
                });
            } else {
                username = result[0].user;
                adminName = result[0].firstName;
                createContent();
            }
        });
    });
});

app.post('/file-upload', function(req, res) {
    var form = new multiparty.Form();

      form.parse(req, function(err, fields, files) {
        if (files) {
          cloudinary.v2.uploader.upload(files.file[0].path,
            {public_id: "" + fields.id},
            function(error, result) {console.log(result, error)}
          );
        } else {
          console.log("Image Failed to upload");
        }
      });

    return;
});

app.post('/settingsForUser', function(req, res) {
    if (req.signedCookies.activeUser == null) {
      res.end('{"error" : "Invalid User", "status" : 401}');
    } else {
      MongoClient.connect(url, function(err, db) {
        var dbo = db.db("reynoldsdb");
        var query = { verificationCode: req.signedCookies.activeUser };
        dbo.collection("accounts").find(query).toArray(function(err, result) {
          if (err) throw err;
          if (result == null || result == "") {
            res.end('{"error" : "Invalid User", "status" : 401}');
          } else {
              var admin = {
                super: result[0].super,
                name: result[0].lastName + ", "+ result[0].firstName,
                email: result[0].user
              };
              res.end('{"success" : "Valid User", "status" : 200, "user": ' + JSON.stringify(admin) + ' }');
          }
          db.close();
        });
      });
    }
});

app.post('/emailAdminInvite', function(req, res) {

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
      from: 'Reynolds SOCS Board <blessstylesocs@gmail.com>',
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

app.post('/admins', function(req, res) {
  var listOfAdmins = [];
  MongoClient.connect(url, function(err, db) {
    var dbo = db.db("reynoldsdb");
    dbo.collection("accounts").find({}).toArray(function(err, result) {
      if (err) throw err;
      if (result == null || result == "") {
        //nothing
      } else {
        for (var i = 0; i < result.length; i++) {
            var admin = {
              role: (result[i].super === 1) ? 'Super Admin' : 'Admin',
              name: result[i].lastName + ", "+ result[i].firstName,
              email:result[i].user
            };
            listOfAdmins.push(admin);
        }
        res.end('{"status" : 200, "adminList": ' + JSON.stringify(listOfAdmins) + ' }');
      }
      db.close();
    });
  });
});

app.post('/deleteAdmin', function(req, res) {
  var listOfAdmins = [];
  MongoClient.connect(url, function(err, db) {
    var dbo = db.db("reynoldsdb");
    var query = { user: req.body.email };
    dbo.collection("accounts").deleteOne(query, function(err, obj) {
      if (err) throw err;
      console.log("Admin: " + req.body.email + ", deleted");
      db.close();
    });
    dbo.collection("accounts").find({}).toArray(function(err, result) {
      if (err) throw err;
      if (result == null || result == "") {
        //nothing
      } else {
        for (var i = 0; i < result.length; i++) {
            var admin = {
              role: (result[i].super === 1) ? 'Super Admin' : 'Admin',
              name: result[i].lastName + ", "+ result[i].firstName,
              email:result[i].user
            };
            listOfAdmins.push(admin);
        }
        var admins = {
            admins: JSON.stringify(listOfAdmins),
            messageDel: "Admin Successfully Deleted"
        };
        fs.readFile(__dirname + '/settings.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, admins);
            res.send(html);
        });
      }
      db.close();
      });
    });
  });

  app.post('/changeEmail', function(req, res) {
    var account = {
        userEmail: req.body.email
    };
    fs.readFile(__dirname + '/changeEmail.html', 'utf8', (err, data) => {
        if (err) throw err;
        var html = mustache.to_html(data, account);
        res.send(html);
    });
  });

  app.post('/changePassword', function(req, res) {
    var account = {
        userEmail: req.body.email
    };
    fs.readFile(__dirname + '/changePassword.html', 'utf8', (err, data) => {
        if (err) throw err;
        var html = mustache.to_html(data, account);
        res.send(html);
    });
  });

  app.post('/updateAccount', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      var dbo = db.db("reynoldsdb");
      var query = { user: req.body.email };
      var updating = "nothing";
      var newvalues;

      function updateAccount() {
        dbo.collection("accounts").updateOne(query, newvalues, function(err, response) {
          if (err) throw err;
          if(updating === "user") {
            console.log("Email Updated");
            var messageEmail = {
                messageEmail: "Email has been updated"
            };
          } else if(updating === "pass") {
            console.log("Password Updated");
            var messagePass = {
                messagePass: "Password has been updated"
            };
          }
          fs.readFile(__dirname + '/settings.html', 'utf8', (err, data) => {
              if (err) throw err;
              var html = mustache.to_html(data, (updating === "user") ? messageEmail : messagePass);
              res.send(html);
          });
          db.close();
        });
      }

      if (req.body.newEmail1) {
        //Check if Email is being used by another account
          var query2 = { user: req.body.newEmail1 };
          dbo.collection("accounts").find(query2).toArray(function(err, result) {
            if (err) throw err;
            if (result == null || result == "") {
              updating = "user";
              newvalues = { $set: {user: req.body.newEmail1} };
              updateAccount();
            } else {
              console.log("Email Aready Exists");
              var messageEmail = {
                  messageEmail: "That email is being used by another account"
              };
              fs.readFile(__dirname + '/settings.html', 'utf8', (err, data) => {
                  if (err) throw err;
                  var html = mustache.to_html(data, messageEmail);
                  res.send(html);
              });
            }
          });
      } else if(req.body.newPassword1){
        updating = "pass";
        newvalues = { $set: {pass: req.body.newPassword1} };
        updateAccount();
      }
    });
  });

  app.post('/contentList', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      var dbo = db.db("reynoldsdb");
      var contentList;

      function getUserInfo() {
        var query = { verificationCode: req.signedCookies.activeUser };
        dbo.collection("accounts").find(query).toArray(function(err, result) {
          if (err) throw err;
          if (result == null || result == "") {
            res.end('{"error" : "Invalid User", "status" : 401}');
          } else {
              var admin = {
                super: result[0].super,
                name: result[0].lastName + ", "+ result[0].firstName,
                admin: result[0].user
              };
              res.end('{"status" : 200, "contentList": ' + JSON.stringify(contentList) + ', "user": ' + JSON.stringify(admin) +' }');
          }
          db.close();
        });
      }

      dbo.collection("content").find({}).toArray(function(err, result) {
        if (err) throw err;
        if (result == null || result == "") {
          res.end('{"error" : "No Content Found", "status" : 401}');
        } else {
          contentList = result;
          getUserInfo();
        }
      });
    });
  });

  app.post('/deleteContent', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      var dbo = db.db("reynoldsdb");
      var query = { id: req.body.id };
      dbo.collection("content").deleteOne(query, function(err, obj) {
        if (err) throw err;
        cloudinary.v2.uploader.destroy("" + req.body.id,
          function(error, result) {
            console.log(result, error);
          }
        );
        console.log("Content: " + req.body.id + ", deleted");
        db.close();
        var messageDelete = {
            messageDelete: "Content was successfully deleted"
        };
        fs.readFile(__dirname + '/edit.html', 'utf8', (err, data) => {
            if (err) throw err;
            var html = mustache.to_html(data, messageDelete);
            res.send(html);
        });
      });
    });
  });

  app.post('/editContent', function(req, res) {
    MongoClient.connect(url, function(err, db) {
      var dbo = db.db("reynoldsdb");
      var query = { id: req.body.id };
      dbo.collection("content").find(query).toArray(function(err, result) {
        if (err) throw err;
        if (result == null || result == "") {
          res.end('{"error" : "No Content Found", "status" : 401}');
        } else {
          var content = {
              content: JSON.stringify(result[0])
          };
          fs.readFile(__dirname + '/editContent.html', 'utf8', (err, data) => {
              if (err) throw err;
              var html = mustache.to_html(data, content);
              res.send(html);
          });
        }
      });
    });
  });

  app.post('/changeContent', function(req, res) {
      var username= "";
      var adminName = "";
      MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
          var dbo = db.db("reynoldsdb");

          function changeContent()
          {
              var query = { id: req.body.idOld };
              if (req.body.idOld === req.body.id) {
                var newvalues = { title: req.body.inputTitle, date: req.body.inputDate, duration: req.body.inputDuration, file:req.body.inputFile};
              } else {
                var newvalues = { title: req.body.inputTitle, date: req.body.inputDate, duration: req.body.inputDuration, file:req.body.inputFile, id:req.body.id};
              }
              dbo.collection("content").updateOne(query, {$set:newvalues}, function(err, response) {
                  if (err) throw err;
              });

              db.close();
              res.redirect('/edit.html');
          }
          console.log(req.signedCookies.activeUser);
          var query = { verificationCode: req.signedCookies.activeUser };
          dbo.collection("accounts").find(query).toArray(function(err, result) {
              if (err) throw err;
              if (result == null || result == "") {
                  console.log("why the frik");
                  var fail = {
                      messageTwo: "Invalid verification code."
                  };
                  db.close();
                  fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
                      if (err) throw err;
                      var html = mustache.to_html(data, fail);
                      res.send(html);
                  });
              } else {
                  username = result[0].user;
                  adminName = result[0].firstName;
                  changeContent();
              }
          });
      });
  });

  app.post('/file-update', function(req, res) {
    var publicId, publicIdOld, path;

    function upload() {
      cloudinary.v2.uploader.upload(path, {public_id: publicId},
        function(error, result) {
          console.log(result, error);
          deleteI();
        }
      );
    }

    function deleteI() {
      cloudinary.v2.uploader.destroy(publicIdOld,
        function(error, result) {
          console.log(result, error);
        }
      );
    }

    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
        path = files.file[0].path;
        publicId = "" + fields.id;
        publicIdOld  = "" + fields.idOld;
        upload();
    });
    return;
  });


http.listen(PORT, function(){
    console.log('listening on localhost:80');
});
