var beacons=require('../services/beacons'),
	mongoose=require('mongoose'),
	Sighting=mongoose.model('Sighting'),
	wmUtils=require('../utils/utils'),
	moment=require('moment');

exports.getPending=function(req,res) {

};

exports.create=function(req,res) {
	// we'll get a beacon maj/min
	// we need to look it up with the beacon service,
	// figure out who owns it,
	// see if that person has already sighted us,
	// log that we've sighted them,

	beacons.UserIDAssignedToBeacon({
		major: req.body.major,
		minor: req.body.minor
	}, function(sightedUserId) {
		if(!sightedUserId) {
			res.send(404, "No User Associated With Beacon");
			return;
		}

		// did our user already sight this other user?
		redis.client.get(redis.userSightingKey(req.userId, sightedUserId), function(err, reply) {
			if(!err && reply)
			{
				// already sighted, carry on soldier
				res.send(200);
			}
			else
			{
				// okay, this is new. flag it for the next hour
				redis.client.setex(redis.userSightingKey(req.userId, sightedUserId), 3600, "y", function(err, reply) {
					if(err) {
						res.send(500, "Database Failure"); // ugh
						return;
					}

					redis.client.get(redis.userSightingKey(sightedUserId, req.userId), function(err, reply) {
						if(!err && reply)
						{
							// they've already sighted us, so this is being handled
							res.send(204);
						}
						else
						{
							var sightingOrigin;
							var sightingRecipient;

							if(wmUtils.coinFlip())
							{
								sightingOrigin=req.userId;
								sightingRecipient=sightedUserId;
							}
							else
							{
								sightingOrigin=sightedUserId;
								sightingRecipient=req.userId;
							}

							var sightingExpiresOn=moment(Date.now).add('minutes', 10);

							var pendingSighting=new Sighting{
								userId: sightingOrigin,
								sightedUserId: sightingRecipient,
								expires: sightingExpiresOn,
								read: false
							};

							pendingSighting.save(function(err) {
								if(err)
								{
									// oh fuck me
									res.send(500);
									return;
								}

								if(sightingOrigin==req.userId)
								{
									res.send(201, pendingSighting);
								}
								else
								{
									// send an APNS notification to sightingOrigin 
									
								}
							});
						}
						
					});
				});
			}
		});
	});
};