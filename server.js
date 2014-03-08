dotenv = require('dotenv');
dotenv.load();

var express=require("express"),
	fs=require('fs');

var env = process.env.NODE_ENV || 'development', 
	config = require('./config/config')[env],
	mongoose = require('mongoose');

var ensureDevelopmentEnv=function(req, res, next) {
	if(env=='development') 
		next();
	else
		res.send(500);
};

var connectDB = function () {
	var options = { server: { socketOptions: { keepAlive: 1 } } }
	mongoose.connect(config.db, options);
}

connectDB();

mongoose.connection.on('error', function (err) {
	logger.log(err, "Mongo");
})

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
	logger.log("Disconnected, reconnecting now", "Mongo");
	connect();
})

mongoose.connection.on('connected', function (){
	logger.log("Connected to Mongo DB", "Mongo");
});

// load models
var paths=[
	"/models",
];

for(var i=0; i<paths.length; i++)
{
	var path=__dirname+paths[i];
	fs.readdirSync(path).forEach(function(file) {
		require(path+"/"+file);
	});
}

// load services and controllers
var	logger=require('./services/logger'),
	auth=require("./controllers/auth"),
	scans=require("./controllers/scans"),
	sightings=require("./controllers/sightings"),
	thumbs=require("./controllers/thumbs"),
	users=require("./controllers/users"),
	userService=require('./services/users'),
	authService=require('./services/jwt-auth'),
	permissionService=require('./services/permissions'),
	beaconsService=require('./services/beacons');

// instantiate app
var app=express();

app.use(express.json());

// TODO:
// Sign requests with a request token that decodes into
//
// 	datetime
//	app_id
//	user_id if the user is logged in
//
// request token is signed with a secret 
// if the user is logged in and the request token doens't have
// a user ID, it's not valid. if they're not logged in the user ID
// cannot be present.

// auth stacks
var can={
	getUser: [authService.EnsureAuthenticated, 
				userService.LoadUserForRequest, 
				permissionService.CanGetUser],

	putUser: [authService.EnsureAuthenticated, 
				userService.LoadUserForRequest, 
				permissionService.CanPutUser],

	thumbUser: [authService.EnsureAuthenticated,
				userService.LoadUserForRequest,
				permissionService.CanThumbUser]
};

var is={
	authenticated: [authService.EnsureAuthenticated,
					userService.LoadUserForRequest],

	notAuthenticated: [authService.EnsureNotAuthenticated],

	authenticatedForSpecifiedUser: [
					authService.EnsureAuthenticated,
					userService.LoadUserForRequest,
					function(req,res,next) {
						if(req.user.id===req.userId) 
							next();
						else
						{
							console.log("Failed authForSpecificUser test");
							res.send(401);
						}
					}
	]
};

// auth routes
app.get('/api/auth/facebook', auth.facebook);															// [x]

// user routes
app.post('/api/users', is.notAuthenticated, users.create);												// [x]
app.put('/api/users/:userId', can.putUser, users.updateById);											// [x]
app.get('/api/users/:userId', can.getUser, users.findById);												// [x]
app.get('/api/users/:userId/beacon', can.getUser, users.findBeaconForUser);								// [x]

// thumbs routes
app.post('/api/users/:userId/thumb', can.thumbUser, thumbs.create);										// [x]

// sightings routes
app.get('/api/users/:userId/sightings', is.authenticatedForSpecifiedUser, sightings.getPendingForUser);	// [x]
app.post('/api/sightings', is.authenticated, sightings.create);											// [x]

// scan routes
app.post('/api/users/:userId/scan', is.authenticatedForSpecifiedUser, scans.beginForUser);				// [x]

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// test routes !!!
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/test/getnextavailablebeacon', ensureDevelopmentEnv, function(req, res) {
	beaconsService.GetNextAvailable(function(beacon) {
		res.send(beacon);
	});
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var port=(process.env.PORT || 3000);

app.listen(port);

logger.log("Now listening, port is "+port);