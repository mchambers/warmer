var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var sightingSchema=new Schema({
	userId: String,
	sightedUserId: String,
	expires: { type: Date, default: Date.now },
	read: Boolean
});

mongoose.model("Sighting", sightingSchema);
