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

// thumbs routes

// sighting routes

// scan routes

var port=(process.env.PORT || 3000);

app.listen(port);

console.log("WARMER: Now listening, brohammer. Port is "+port);