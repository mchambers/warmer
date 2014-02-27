var mongoose=require('mongoose');
var redis=require('../modules/redis');

var Schema=mongoose.Schema;

var userSchema=new Schema({
	name: String,
	pictureURL: String,
	rating: Number,
	signed_up: { type: Date, default: Date.now },
	facebook_user_id: String
});

userSchema.methods.getBeacon=function(cb) {
	redis.client.get(redis.userBeaconKey(this.id), function(err, reply) {
		var ret=null;

		if(reply)
		{
			var beaconSplit=reply.split("|");
			ret={
				major: parseInt(beaconSplit[0]),
				minor: parseInt(beaconSplit[1])
			};
		}

		cb(ret);
	});
};

userSchema.methods.setBeacon=function(major, minor, cb) {
	redis.client.set(redis.userBeaconKey(), major+"|"+minor, cb);
};

module.exports=userSchema;