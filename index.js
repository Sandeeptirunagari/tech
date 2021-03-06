var express = require('express')
var bodyParser = require('body-parser')
var passport = require('passport')
var nodemailer = require('nodemailer');
const request = require('request');
const passportLocalStrategy = require("passport-local").Strategy;
 var ejs = require('ejs');    
 var bcrypt=require( 'bcrypt')
                                     
var User = require('./models/user');
var randomstring=require("randomstring");
const port = process.env.PORT||3000;
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        //giving the mail details through which the mail should be sent agfter signed up
           user: 'techluminav@gmail.com',
           pass: 'Tejasri08'
       }
   });
var app = express()

app.use(bodyParser.urlencoded({ extended: true }));
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
//&useNewUrlParser=true&useUnifiedTopology=false
//connecting ourdatabase
mongoose.connect('mongodb+srv://Userdb:tejasri@8@mongodb01-31hfc.mongodb.net/loginup?retryWrites=true&w=majority', 
{ useNewUrlParser: true , useUnifiedTopology:true ,useCreateIndex:true,}).then(() => { console.log("successful db connection") }).catch((err) => { console.log(err) });
mongoose.set('useFindAndModify', false);
app.set("view engine", 'ejs');
app.use(require('express-session')({
    //hashing the password
    secret: "salt",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new passportLocalStrategy((username, password, done) => {
      User.findUser(username, (err, docs) => {
        if (err) {
          throw err;
        } else if (docs) {
          User.comparePassword(password, docs.password, (err, isMatch) => {
            if (isMatch) {
              return done(null, docs);
            } else {
              return done(null, false, {
                message: "Invalid Password",
              });
            }
          });
        } else {
          return done(null, false, {
            message: "User not found",
          });
        }
      });
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id); // check
  });
  passport.deserializeUser((id, done) => {
    User.findUserById(id, (err, docs) => {
      done(err, docs);
    });
  });

app.get('/' ,(req,res)=>{
res.render('login',{data:{view :false }})
})
//render to the register page
app.get("/signup?", (req, res)=> {
  res.render("register", { data: { view: false } });
});
//render to the details page once we click on login
app.get('/login', isLoggedIn, function (req, res) {
    res.render('details',{ data: { view: false } })
})
//posting  details in register page 
app.post("/signup", function (req, res) {
   
  User.createUser({ email: req.body.email,
     password: req.body.password,
     username: req.body.username,
     phonenumber:req.body.phonenumber,
     meteridnumber:req.body.meteridnumber,
     adhaarnumber:req.body.adhaarnumber }
     ,function (err) {
      if (err) {
          res.render('register', { data: { view: true, msg: err } })//if error msg will print
      } else {
              res.render('login' ,{ data: { view: false   } });//if correct render to login page
          //sending email after successfully signedup
          const mailOptions = {
            from: 'techluminav@gmail.com', // sender address
            to: req.body.email, // list of receivers
            subject: 'Subject of your email', // Subject line
            html: `<h2>Welcome to Techlumin Av</h2>
            <h1> ${req.body.username}</h1>
           
            `// plain text body
          };
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });

      }
      
  });


});
//posting in login page
app.post("/login", function (req, res) {
    //if user is not given msg will print
  if (!req.body.username) {
      res.render('login', { data: { view: true, msg1: "Username was not given" } })
  } else {
      //if password is not given msg will print
      if (!req.body.password) {
          res.render('login', { data: { view: true, msg: "Password was not given" } })
      } else {
          passport.authenticate('local', function (err, user, info) {
              if (err) {
                  console.log(err)

                  res.render('login', { data: { view: true, msg: err } })
              } else {
                  if (!user) {
                      //if given details are wrong
                      res.render('login', { data: { view: true, msg: "Username or password incorrect " } })//if given details are wrong
                  } else {
                      req.login(user, function (err) {
                          if (err) {
                              console.log(err)
                              res.render('login', { data: { view: true, msg: err } })
                          } else {
                              //if the ogin details are correct render to details page&and show helps us to print username
                            
                              res.render('details' ,{data:{view : true ,show : req.body.username}});
                        
                            
                            
                          }
                      })
                  }
              }
          })(req, res);
      }
  }
}
)



app.get('/getall' ,isLoggedIn,(req,res)=>{
    User.findById(req.user.id).populate(
       {
       path:"users", 
        options: { sort:{ 'date': -1 }}}).exec(function (err, user) {
        if (err) {
            console.log(err);
        } else {
            res.render('alldetails',{data:{view:true , result:user.details }})
        }
    })
    

})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  } else {
      res.redirect('/');
  }

}
//logout 
app.get("/logout", function (req, res) {
    req.logout();
    res.render('login', { data: { view: false } });
});


//forgot password
app.get("/forgotpassword",function(req,res){
    res.render('forgotPassword',{data:{view:false}});
})
app.post("/newPassword",function(req,res){
    User.findOne({adhaarnumber
        :req.body.adhaarnumber
    },(err,user)=>{
        if(err){
        console.log(err);
        res.render('forgotPassword',{data:{view:true ,msg:err}});

        }
        else{
            if(user){
            
             var token=randomstring.generate();
          
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                       user.save(function(err){
                           if(err){
                               console.log(err)
                           }
                       });
                      
             //sending email after successfully signedup
          const mailOptions = {
            from: 'techluminav@gmail.com', // sender address
            to: user.email, // list of receivers
            subject: 'Subject of your email', // Subject line
            text :'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' +token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });
             res.render('forgotPassword', { data: { view: true ,msg:"mail has been sent to "+user.email} });
            }
            else{
                 
                 res.render('forgotPassword',{data:{view:true ,msg:"user not found"}});
            }
        }
    })
})
app.get('/reset/:token',(req,res)=>{   
   User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      
      return res.redirect('/forgot');
    }
    res.render('newPassword', {
      user:user
    });
  });
})
app.post('/updatePassword/:token' ,(req,res)=>{
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      console.log(user);
        if (!user) {
          return res.redirect('back');
        }
            
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        bcrypt.genSalt(10, function (err, salt) {
            if(err)
            console.log(err)
        bcrypt.hash(user.password, salt, function (err, hash) {
        user.password = hash;
        user.save(function(err) {
         if(err){
             console.log(err)

         }
         else{
            const mailOptions = {
                from: 'techluminav@gmail.com', // sender address
                to: user.email, // list of receivers
                subject: 'Subject of your email', // Subject line
                text :'sucessfully updated password '+
                'THANKYOU'
              };
              transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                  console.log(err)
                else
                  console.log(info);
             });
             res.render('login',{data:{view:false}});
         }
          });

        });
    });
      });
    });
app.listen(port, () => { console.log(" server running") })
