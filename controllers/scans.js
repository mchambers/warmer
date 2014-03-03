var mongoose=require('mongoose'),
	User=mongoose.model('User'),
	Scan=mongoose.model('Scan'),
	BeaconService=require('../services/beacons');

module.exports.stopForUser=function(req,res) {
	if(!req.userId)
	{
		res.send(400);
		return;
	}

	
};

module.exports.beginForUser=function(req, res) {
	if(!req.userId)
	{
		res.send(400);
		return;
	}

	// assign a beacon to this user
	// tell them what it is

	// first, stop any active scans the user has
	Scan.stopAllForUser(req.userId, function(stopped) {
		// proceed regardless of the return code for this function,
		// but wait until it finishes so we don't accidentally
		// stop the one we are about to create

		var beacon=BeaconService.GetNextAvailable(function(beacon) {
			BeaconService.AssignBeaconToUser(beacon, req.userId, function(success) {
				req.user.setBeacon(beacon, function(err, reply) {
					if(err)
					{
						res.send(500);
						return;
					}

					// we've got the user beacon all squared away, now begin the scan.
					var scan=new Scan({
						userId: req.userId,
						device: "iOS",
						major: beacon.major,
						minor: beacon.minor,
						ttl: beacon.ttl,
						active: true
					});

					scan.save(function(err) {
						if(err)
							res.send(500);
						else
							res.send(201, scan);
					});
				});
			});
		});
	});
};