var redis=require('redis'),
	client=redis.createClient();

var redisEx={
	client: client,
	userBeaconKey: function(userId) {
		return "user:"+userId+":beacon";
	},
	beaconKey: function(major, minor) {
		return "beacon:"+major+":"+minor;
	},
	beaconGlobalMinorKey: function() {
		return "beacon:minor";
	},
	beaconGlobalMajorKey: function() {
		return "beacon:major";
	},
	userThumbKey: function(user1Id, user2Id) {
		return "user:"+user1Id+":thumb:"+user2Id;
	},
	userPermittedKey: function(user1Id, user2Id) {
		return "user:"+user1Id+":permitted:"+user2Id;
	},
	userPendingSightingsKey: function(userId) {
		return "user:"+userId+":pending_sightings";
	},
	userSightingKey: function(user1Id, user2Id) {
		return "user:"+user1Id+":sighting:"+user2Id;
	}
};

module.exports=redisEx;