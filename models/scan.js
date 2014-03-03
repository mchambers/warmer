var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var scanSchema=new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User' },
	startedAt: { type: Date, default: Date.now },
	device: String,
	major: Number,
	minor: Number,
	ttl: Number,
	active: Boolean
});

// just returns the first one.
scanSchema.statics.userHasActiveScan=function(uId, cb) {
	this.findOne({ userID: new mongoose.Types.ObjectId(uId), active: true }, function(err, scan) {
		if(!err && scan)
			cb(scan);
		else
			cb(null);
	});
};

scanSchema.statics.stopAllForUser=function(uId, cb) {
	var q=this.find({ userId: new mongoose.Types.ObjectId(uId) });
	q.options={multi: true};
	q.update({active: false}, function(err, numAffected) {
		console.log(numAffected);
		cb((!err));
	});
};

mongoose.model("Scan", scanSchema);
