var mongoose=require('mongoose');
var User=mongoose.model('User');

exports.create=function(req,res) {
	var tmpUser=req.body;
	if(!req.body)
	{
		res.send(400);
		return;
	}

	var newUser=new User({
		name: tmpUser.name,
		pictureURL: tmpUser.pictureURL,
		rating: 0.0,
		facebook_user_id: "xxx"
	});

	newUser.save(function(err) {
		if(err)
		{
			console.log(err);
			res.send(500);
		}
		else
		{
			res.send(201, newUser);
		}
	});
};

exports.updateById=function(req,res) {
	User.findById(req.params.userId, function(err, user) {
		if(err)
		{
			res.send(400);
		}
		else
		{
			for(var k in req.body)
			{
				if(k!="social_connections" && k!="id" && k!="_id" && k!="gender")
					user[k]=req.body[k];
			}

			user.save(function(err) {
				if(err)
				{
					res.send(500);
				}
				else
				{
					res.send(200, user);
				}
			});
		}
	});
};

exports.findById=function(req, res) {
	User.findById(req.params.userId, function(err, user) {
		if(err)
		{
			res.send(404);
		}
		else
		{
			// filter the user based on audience
			// ...maybe some day
			if(req.user.id==req.params.userId)
				res.send(200, user);
			else
				res.send(200, user.filter());
		}
	});
};

exports.findBeaconForUser=function(req, res) {
	User.findById(req.params.userId, function(err, user) {
		if(err)
		{
			res.send(404);
		}
		else
		{
			user.getBeacon(function(beacon) {
				if(!beacon)
					res.send(404);
				else
					res.send(200, beacon);
			});
		}
	});
};