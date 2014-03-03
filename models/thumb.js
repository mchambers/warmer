var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var THUMB_DEFAULT_TTL=86400;

var thumbSchema=new Schema({
	userId: String,
	thumbedUserId: String,
	like: Boolean,
	scanId: String,
	createdAt: {type: Date, default: Date.now},
	ttl: { type: Number, default: THUMB_DEFAULT_TTL },
	result: String // defer, seek or stand
});

thumbSchema.pre('save', function(next) {
	if(!this.ttl || this.ttl===0)
		this.ttl=THUMB_DEFAULT_TTL;

	var keyVal=(this.like ? "true" : "false");
	
	redis.client.setex(redis.userThumbKey(this.userId, this.thumbedUserId), this.ttl, keyVal, function(err, reply) {
		if(!err)
		{
			next();
		}
	});
});

thumbSchema.statics.existsForUserByUser=function(forUser, byUser, cb) {
	var retVal={	
		like: false
	};

	redis.client.get(redis.userThumbKey(byUser, forUser), function(err, val) {
		if(!err)
		{
			retVal.like=(val==="true");
			cb(retVal);
		}
		else
			cb(null);
	});
};

mongoose.model("Thumb", thumbSchema);
