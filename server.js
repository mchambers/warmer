dotenv = require('dotenv');
dotenv.load();

var express=require("express"),
	fs=require('fs'),
	logger=require('./services/logger'),
	auth=require("./controllers/auth"),
	scans=require("./controllers/scans"),
	sightings=require("./controllers/sightings"),
	thumbs=require("./controllers/thumbs"),
	users=require("./controllers/users"),
	userService=require('./services/users'),
	authService=require('./services/jwt-auth'),
	permissionService=require('./services/permissions'),
	beaconsService=require('./services/beacons');

var app=express();

var env = process.env.NODE_ENV || 'development', 
	config = require('./config/config')[env],
	mongoose = require('mongoose');

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

// Bootstrap models
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

// auth middleware stack
var ensurePermitted=[
	authService.EnsureAuthenticated,
	userService.LoadUserForRequest,
	permissionService.EnsurePermissions
];

// auth routes
app.get('/api/auth/facebook', auth.facebook);

// test routes
app.get('/test/getnextavailablebeacon', function(req, res) {
	beaconsService.GetNextAvailable(function(beacon) {
		res.send(beacon);
	});
});

// user routes
app.post('/api/users', authService.EnsureNotAuthenticated, users.create);
app.put('/api/users/:userId', ensurePermitted, users.updateById);
app.get('/api/users/:userId', ensurePermitted, users.findById);
app.get('/api/users/:userId/beacon', ensurePermitted, users.findBeaconForUser);

// thumbs routes
app.post('/api/thumbs', ensurePermitted, thumbs.create);

// sighting routes
app.get('/api/sightings', ensurePermitted, sightings.getPending);

// scan routes
app.post('/api/scan', ensurePermitted, scans.begin);

var port=(process.env.PORT || 3000);

app.listen(port);

logger.log("Now listening, port is "+port);