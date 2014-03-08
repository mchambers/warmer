var redis=require('./redis'),
	mongoose=require('mongoose'),
	Sighting=mongoose.model("Sighting");

var PermissionService={
	CanGetUser: function(req,res,next) {
		if(req.params.userId==='me')
		{
			req.params.userId=req.userId;
		}
		
		if(req.userId==req.params.userId)
		{
			next();
		}
		else
		{
			// check double thumbs

			res.send(401);
		}
	},
	CanPutUser: function(req,res,next) {
		if(req.userId==req.params.userId)
			next();
		else
			res.send(401);
	},
	CanThumbUser: function(req,res,next) {
		// when can someone "thumb" a user?
		// if they've sighted them.

		// see if there's a pending sighting we're thumbing against
		Sighting.findOne({
			user: req.userId,
			sightedUser: req.params.userId
		}, function(err, sighting) {
			if(err || !sighting) 
			{
				res.send(401);
			}
			else 
			{
				next();
			}
		});
	}
};

module.exports=PermissionService;