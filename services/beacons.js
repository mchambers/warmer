// ACD92B22-6D94-4FEA-92E7-E3488D9EFEC3

// this should definitely be refactored into a model
// just a POCO with static model methods 

// but we CAN'T REFACTOR NOWWWWW can we?

var redis=require('./redis'),
	logger=require('./logger'),
	Beacon=require('../models/beacon');

// derp, max 16-bit ints
var IBEACON_MAX_MAJOR=32767;
var IBEACON_MAX_MINOR=32767;

var BEACON_DEFAULT_TTL=86400; // one hour

// redis.io -> commands -> set
// example: "simple lock mechanism"
var rdUnlockScript='if redis.call("get",KEYS[1]) == ARGV[1] \
	then \
    	return redis.call("del",KEYS[1]) \
	else \
   		return 0 \
	end';

// get the major beacon version
// if it isn't set yet, set it
var rdGetMajorScript='local major=redis.pcall("get", KEYS[1]) \
	if major == false then \
		redis.call("set", KEYS[1], 0) \
		return 0 \
	else \
		return major \
	end';

// http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
function makeLockToken()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var Beacons={
	AssignBeaconToUser: function(beacon, userId, cb) {
		// assign this beacon to this user for 24 hours
		redis.client.setex(redis.beaconKey(beacon.major, beacon.minor), beacon.ttl, userId, function(err, reply) {
			var success=(!err);
			cb(success);
		});
	},
	UserIDAssignedToBeacon: function(beacon, cb) {
		redis.client.get(redis.beaconKey(beacon.major, beacon.minor), function(err, reply) {
			if(err || !reply)
			{
				cb(null);
			}
			else
			{
				cb(reply);
			}
		});
	},
	//
	//	This should be implemented as a queue of available beacons
	//	that just gets popped, and if there's nothing left on it,
	//	tough shit.
	//
	//	How do you reclaim beacons from the stack once they're released?
	//	If the client is polite enough to just release it, you return it
	//	to the stack at that time. Otherwise you'd need a background job
	//	that ran the "reclaim queue"
	//
	GetNextAvailable: function(cb) {
		var lockToken=makeLockToken();
		logger.log("Attempting to lock the beacon records with token "+lockToken, "Beacons");

		// defeat^N^N^Ndelete the lock via the power of lua
		var performUnlock=function(beacon, success) {
			logger.log("Unlocking the beacon DB", "Beacons");

			redis.client.eval([rdUnlockScript, 1, "beacon:lock", lockToken], function(err, repl) {
				if(err)
				{
					logger.log("Error occurred unlocking the beacon records, "+err, "Beacons");
				}

				success(beacon);
			});
		};

		// note: we're not actually doing this right now.
		var verifyAvailability=function(beacon, verifyCb) {
			var isAvailable=false;

			logger.log("Verifying availability of the selected beacon", "Beacons");

			redis.client.get(redis.beaconKey(beacon.major, beacon.minor), function(err, repl) {
				if(!repl || err)
				{
					verifyCb(true);
				}
				else
				{
					verifyCb(false);
				}
			});
		};

		// try 2 get dat lock
		redis.client.set(["beacon:lock", lockToken, "NX", "EX", 1], function(err, repl) {
			if(!repl || err)
			{
				// if we can't get the lock, try again, seemingly FOREVERRRRR
				logger.log("Couldn't lock the beacon records (got "+repl+"), trying again in 3ms: "+err, "Beacons");
				logger.log("Redis connection state: "+redis.client.connected);
				setTimeout(Beacons.GetNextAvailable, 2500, cb);
				return;
			}

			logger.log("Attempting to get the global minor key", "Beacons");
			redis.client.incr(redis.beaconGlobalMinorKey(), function(err, repl) {
				logger.log("Retrieved global minor key", "Beacons");

				if(!repl || err)
				{
					logger.log("Couldn't get the global beacon minor key: "+err, "Beacons");
					performUnlock(null, cb);
					return;
				}

				var globalMinor=repl;
				if(globalMinor>IBEACON_MAX_MINOR)
				{
					logger.log("We've reached max minor for this major", "Beacons");

					redis.client.incr(redis.beaconGlobalMajorKey(), function(err, repl) {
						if(!repl || err)
						{
							logger.log("Couldn't get the global beacon major key: "+err, "Beacons");
							performUnlock(null, cb);
							return;
						}

						var globalMajor=repl;
						if(globalMajor>IBEACON_MAX_MAJOR)
						{
							logger.log("We've reached max major, rolling over, oh fuck oh fuck oh fuck", "Beacons");
							redis.client.multi().set(redis.beaconGlobalMinorKey(), 0)
								.set(redis.beaconGlobalMajorKey(), 0)
								.exec(function(err, replies) {
									if(err)
									{
										performUnlock(null, cb);
										return;
									}

									performUnlock(new Beacon(0, 0, BEACON_DEFAULT_TTL), cb);
							});
						}
						else
						{
							redis.client.set(redis.beaconGlobalMinorKey(), 0, function(err, repl) {
								if(err)
								{
									performUnlock(null, cb);
									return;
								}

								var nextBeacon=new Beacon(globalMajor, 0, BEACON_DEFAULT_TTL);
								performUnlock(nextBeacon, cb);
							});
						}
					});
				}
				else
				{
					logger.log("Beacon minor is good 2 go, grabbing beacon major", "Beacons");
					redis.client.eval([rdGetMajorScript, 1, redis.beaconGlobalMajorKey()], function(err, repl) {
						console.log(err);
						var globalMajor=parseInt(repl);
						var nextBeacon=new Beacon(globalMajor, globalMinor, BEACON_DEFAULT_TTL);
						performUnlock(nextBeacon, cb);
					});
				}
			});

		});
	}
};

module.exports=Beacons;