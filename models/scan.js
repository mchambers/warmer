var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var scanSchema=new Schema({
	userId: String,
	startedAt: { type: Date, default: Date.now },
	device: String,
	major: Number,
	minor: Number,
	ttl: Number,
	active: Boolean
});

// just returns the first one.
scanSchema.statics.userHasActiveScan=function(uId, cb) {
	this.findOne({ userID: uId, active: true }, function(err, scan) {
		if(!err && scan)
			cb(scan);
		else
			cb(null);
	});
};

scanSchema.statics.stopAllForUser=function(uId, cb) {
	this.update({ userId: uId, active: false }, function(err, numAffected) {
		cb((!err));
	});
};

mongoose.model("Scan", scanSchema);
