var User = require('../models/user');
var config = require('../../config');
var passport = require('passport');
var nodemailer = require("nodemailer");
var fs = require('fs');
var secretKey = config.secretKey;

var jwt = require('jsonwebtoken');


var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/files/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage });

// get passport stratergy
require('../models/passport')(passport);

var rand;
rand = Math.random().toString(36).substr(2, 10);
function createToken(user) {

	var token = jwt.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresIn: 10080
	});

	return token;
}
module.exports = function (app, express, io) {
	
	var api = express.Router();

	api.post('/signup', function(req, res) {
		if(!req.body.email || !req.body.password) {
			res.json({ success: false, message: 'Please enter emil and password to register.'});
		}
		else {
			var newUser = new User ();
                newUser.username    = req.body.username;
				newUser.email = req.body.email,
				newUser.password = newUser.generateHash(req.body.password);
                newUser.tempid = rand;
                newUser.activationStatus = false;
			

			newUser.save(function(err){
				if(err) {
					return res.json({ success: false, message:'Email address already exist'});
				}
				res.json({ success: true, message: 'Signup Successfull.' });
			});
		}
	});
	api.post('/authenticate', function(req, res) {
		User.findOne({ 'email': req.body.email }, function(err, user) {
			if(err) console.log(err);
			if(!user) res.json({ success: false, message: 'Authentication failed No user found'});
			else {
	            if (!user.validPassword(req.body.password)) {
					res.json({ success: false, message: 'Authentication failed password doesnt match'});
	            }
				else {
					var token = createToken(user);
					res.json({
						success: true,
						message: 'Authentication successfull',
						token: 'JWT ' + token
					});
				}
			}
		});
	});

	api.get('/me', passport.authenticate('jwt', { session: false }), function(req, res){
		res.json({
			username: req.user.username,
			userid:req.user._id
		});
	});



	api.post('/files', upload.single('file'), function(req, res){
		res.json({ 'success':true, 'fname':req.file.filename });
	});

	return api;

}