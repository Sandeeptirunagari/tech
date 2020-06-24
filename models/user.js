var mongoose = require('mongoose'); 
var Schema = mongoose.Schema; 
var passportLocalMongoose = require('passport-local-mongoose'); 
var bcrypt=require( 'bcrypt')
  //writing user schema
  
var userSchema = new Schema({    
    email: {type: String, required:true ,unique:true}, 
    username : {type: String,  required:true,unique:true},
    phonenumber:{type:Number,required:true,unique:true},
    meteridnumber :{type:String,required:true,unique:true},
    adhaarnumber:{type:Number,required:true,unique:true},
    resetPasswordToken:{type:String},
    resetPasswordExpires:{type :Number},
    password:{type:String,required:true},
    dairies: [
        {type: mongoose.Schema.Types.ObjectId,ref:'Details'}
    ]
}); 
var User = module.exports= mongoose.model("User", userSchema);
module.exports.findUserById = (id, callback) => {
    User.findById(id, callback);
  }
  module.exports.findUser = (username, callback) => {
    User.findOne({
      username
    }, (err, docs) => {
      callback(err, docs);
    })
  }
module.exports.comparePassword = function (passw, hash, cb) {
    bcrypt.compare(passw, hash, function (err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  };
  
  module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function (err, salt) {
      console.log(err);
      bcrypt.hash(newUser.password, salt, function (err, hash) {
        var password = newUser.password;
        newUser.password = hash;
        User.create(newUser, function (err, doc) {
          if (err) {
            password = undefined;
          }
          callback(err);
        });
      });
    });
  } 

 
 
 