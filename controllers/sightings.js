var beacons=require('../services/beacons'),
	mongoose=require('mongoose'),
	Sighting=mongoose.model('Sighting'),
	wmUtils=require('../utils/utils'),
	moment=require('moment'),
	User=mongoose.model('User'),
	notifications=require('../services/notifications');

exports.getPendingForUser=function(req,res) {
	if(!req.userId)
	{
		res.send(404);
	}

	Sighting.find({ userId: req.userId, read: false }).populate("userId sightedUserId").exec(function(err, sightings) {
		res.send(200, sightings);
	});
};

exports.update=function(req,res) {
	if(!req.body || !(req.body instanceof Array) || !req.userId)
	{
		res.send(400);
		return;
	}

	var ids=[];

	for(var i=0; i<req.body.length; i++)
	{
		if(req.body[i].hasOwnProperty("id"))
			ids.push(req.body[i].id);
	}

	var success=function(){
		res.send(204);
	};

	if(ids.length>0)
	{	
		Sighting.update({ id: {$in: ids} }, { read: true }, function(err, numAffected) {
			if(err)
				res.send(500);
			else
				success();
		});	
	}
	else
		success();
}

// big ol' fat controller method 
exports.create=function(req,res) {
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
							var sightedUser=User.findById(sightedUserId, function(err, sightedUser) {
								if(err || !sightedUser)
								{
									res.send(500);
									return;
								}

								if(sightedUser.isSightableBy(req.user) && req.user.isSightableBy(sightedUser))
								{
									// <3 <3 <3 :D
									var sightingOriginId;
									var sightingRecipientId;

									if(wmUtils.coinFlip())
									{
										sightingOriginId=req.userId;
										sightingRecipientId=sightedUserId;
									}
									else
									{
										sightingOriginId=sightedUserId;
										sightingRecipientId=req.userId;
									}

									var sightingExpiresOn=moment(Date.now).add('minutes', 10);

									var pendingSighting=new Sighting({
										userId: sightingOriginId,
										sightedUserId: sightingRecipientId,
										expires: sightingExpiresOn,
										read: false
									});

									pendingSighting.save(function(err) {
										if(err)
										{
											// oh fuck me srsly?
											res.send(500);
											return;
										}

										if(sightingOriginId==req.userId)
										{
											res.send(201, pendingSighting);
										}
										else
										{
											// send an APNS notification to sightingOrigin 
											notifications.notifyUserOfSighting(sightedUser, sighting, function(success) {
												res.send(204);
											});
										}
									});
								}
								else
								{
									res.send(204); // eyyyy don't worry about it
								}
							});
						}
						
					});
				});
			}
		});
	});
};