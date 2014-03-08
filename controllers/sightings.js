var beacons=require('../services/beacons'),
	mongoose=require('mongoose'),
	Sighting=mongoose.model('Sighting'),
	wmUtils=require('../utils/utils'),
	moment=require('moment'),
	User=mongoose.model('User'),
	notifications=require('../services/notifications'),
	redis=require('../services/redis');

exports.getPendingForUser=function(req,res) {
	if(!req.userId)
	{
		res.send(404);
	}

	// we're not populating the userId field here because it'll just be the requester's
	// user record over and over.
	Sighting.find({ user: new mongoose.Types.ObjectId(req.userId), read: false })
		.populate("sightedUser", "-email -social_connection -signed_up")
		.exec(function(err, sightings) {
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
		var q=Sighting.where({id: {$in: ids} });
		q.options={multi: true};
		q.update({read: true}, function(err, numAffected) {
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
				console.log(req.userId + " already sighted " + sightedUserId);
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
					console.log("flagging "+req.userId + " as having sighted " + sightedUserId);

					redis.client.get(redis.userSightingKey(sightedUserId, req.userId), function(err, reply) {
						if(!err && reply)
						{
							// they've already sighted us, so this is being handled
							console.log("...but they already sighted us");
							res.send(204);
						}
						else
						{
							console.log("let's look up their user");

							var sightedUser=User.findById(sightedUserId, function(err, sightedUser) {
								if(err || !sightedUser)
								{
									res.send(500);
									return;
								}

								if(sightedUser.isSightableBy(req.user) && req.user.isSightableBy(sightedUser))
								{
									// <3 <3 <3 :D
									console.log("we are sightable by each other");

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

									var sightingExpiresOn=moment().add('minutes', 10);

									var pendingSighting=new Sighting({
										user: sightingOriginId,
										sightedUser: sightingRecipientId,
										expires: sightingExpiresOn,
										read: false
									});

									pendingSighting.save(function(err) {
										if(err)
										{
											console.log("error saving the sighting " + err);

											// oh fuck me srsly?
											res.send(500);
											return;
										}

										if(sightingOriginId==req.userId)
										{
											console.log("this user gets the new sighting");
											res.send(201, pendingSighting);
										}
										else
										{
											console.log("the other user gets the new sighting");

											// send an APNS notification to sightingOrigin 
											notifications.notifyUserOfSighting(sightedUser, pendingSighting, function(success) {
												res.send(204);
											});
										}
									});
								}
								else
								{
									console.log("not sightable by each other so move on");
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