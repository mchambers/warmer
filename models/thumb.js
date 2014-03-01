var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var thumbSchema=new Schema({
	userID: String,
	thumbedUserID: String,
	like: Boolean,
	createdAt: {type: Date, default: Date.now}
});

mongoose.model("Thumb", thumbSchema);
