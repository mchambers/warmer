dotenv = require('dotenv');
dotenv.load();

var express=require("express"),
	auth=require("./routes/auth"),
	scans=require("./routes/scans"),
	sightings=require("./routes/sightings"),
	thumbs=require("./routes/thumbs"),
	users=require("./routes/users");

var app=express();

// Routes!

// auth routes
app.get('/api/auth/facebook', auth.facebook);

// user routes
app.post('/api/users', users.create);
app.put('/api/users/:userId', users.updateById);
app.get('/api/users/:userId', users.findById);
app.get('/api/users/:userId/beacon', users.findBeaconForUser);

// thumbs routes
app.post('/api/thumbs', thumbs.create);

// sighting routes
app.get('/api/sightings', sightings.getPending);

// scan routes
app.post('/api/scan', scans.begin);

var port=(process.env.PORT || 3000);

app.listen(port);

console.log("WARMER: Now listening, brohammer. Port is "+port);