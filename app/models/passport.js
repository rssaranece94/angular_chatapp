var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('./user');
var config = require('../../config');

module.exports = function (passport) {
	var opts = {};
	opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
	opts.secretOrKey = config.secretKey;
	passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
		User.findOne({'_id': jwt_payload.id}, function(err, user){
			if(err) {
				console.log(err);
				return done(err, false);
			}
			if(user) {
				return done(null, user);
			}
			else {
				console.log('no user');
				return done(null, false);
			}
		});
	}));
};