var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var userSchema=new Schema({
	name: String,
	slogan: String,
	pictureURL: String,
	rating: Number,
	signed_up: { type: Date, default: Date.now },
	gender: String,
	gender_seeking: String,
	out_for: String,
	out_with: String,
	email: String,
	social_connection: [
	{
		type: {type: String},
		user_id: String
	}]
});

userSchema.methods.filter=function() {
	return {
		name: this.name,
		pictureURL: this.pictureURL,
		rating: this.rating,
		gender: this.gender,
		gender_seeking: this.gender_seeking,
		out_for: this.out_for,
		out_width: this.out_with
	};
};

userSchema.methods.getBeacon=function(cb) {
	redis.client.get(redis.userBeaconKey(this.id), function(err, reply) {
		var ret=null;

		if(reply && !err)
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

// obviously this requires both users to already have been called up from the database at some point
// maybe we can have a CB version that lazy-loads the other user by ID?
userSchema.methods.isSightableBy=function(user) {
	//
	// oh wow
	//
	// 			such complex
	//
	//	so algorithm
	//
	if(this.gender_seeking===user.gender || this.gender_seeking==="either")
		return true;
	return false;
};

mongoose.model("User", userSchema);
