var redis=require('../services/redis'),
	mongoose=require('mongoose'),
	Thumb=mongoose.model('Thumb'),
	Sighting=mongoose.model('Sighting'),
	moment=require('moment'),
	notifications=require('../services/notifications'),
	Scan=mongoose.model('Scan'),
	Seek=mongoose.model('Seek'),
	wmUtils=require('../utils/utils');

exports.create=function(req, res) {
	// so if we get a thumb here,
	// we can potentially have DOUBLE THUMBS

	// if that happens, we have a match and can begin homing
	// do we record that match? I think we should.
	var currentActiveScan=Scan.userHasActiveScan(req.userId, function(scan) {
		if(!scan)
		{
			res.send(400);
			return;
		}

		var thumb=new Thumb({
			userId: req.userId,
			thumbedUserId: req.body.thumbedUserId,
			like: req.body.like,
			scanId: currentActiveScan.id
		});

		Thumb.existsForUserByUser(req.body.thumbedUserId, req.userId, function(thumb) {
			if(!thumb)
			{
				// no other side exists yet
				// store a sighting
				thumb.result="defer";
				thumb.save(function(err) {
					if(err)
					{
						res.send(500);
						return;
					}

					if(thumb.like)
					{
						var sightingExpiresOn=moment(Date.now).add('minutes', 10);

						var pendingSighting=new Sighting({
							userId: thumbedUserId,
							sightedUserId: req.userId,
							expires: sightingExpiresOn,
							read: false
						});

						pendingSighting.save(function(err) {
							res.send(204);

							// send APNS
							//notifications.notifyUserOfSighting()
						});
					}
				});
			}
			else if(thumb && thumb.like===true)
			{
				// other side exists and SAID YES!! OMFG

				// coin flip for thumb status
				// find and update the other thumb record with their new status
				// grant permissions
				// 

				// make a seek.
				var seek=new Seek({
					scanId: currentActiveScan.id
				});

				// i'm mr. meeseeks. look at me.
				var meSeeks=wmUtils.coinFlip();
				if(meSeeks)
				{
					// we're seeking, they're standing.
					thumb.result="seek";
					seek.seekingUserId=req.userId;
					seek.seekedUserId=thumbedUserId;
				}
				else
				{
					// we're standing.
					thumb.result="stand";
					seek.seekingUserId=thumbedUserId;
					seek.seekedUserId=req.userId;
				}

				thumb.save(function(err) {
					if(err)
					{
						res.send(500);
						return;
					}

					seek.save(function(err) {
						// send the APNS to thumbed user

						res.send(201, seek);
					});
				});
			}
			else if(thumb && thumb.like!==true)
			{
				// other side exists and said NO
				thumb.result="no_match";
				thumb.save(function(err) {
					res.send(204);
				});
			}
			else 
			{
				// wtf else could've happened
				res.send(500);
				return;
			}
		});
	});
};