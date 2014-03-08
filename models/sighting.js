var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var sightingSchema=new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User' },
	sightedUser: { type: Schema.Types.ObjectId, ref: 'User' },
	expires: { type: Date, default: Date.now },
	read: Boolean
});

mongoose.model("Sighting", sightingSchema);
