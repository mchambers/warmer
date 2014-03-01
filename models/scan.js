var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var scanSchema=new Schema({
	userID: String,
	startedAt: { type: Date, default: Date.now },
	device: String,
	major: Number,
	minor: Number,
	ttl: Number
});

mongoose.model("Scan", scanSchema);
