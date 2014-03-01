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

};

exports.findById=function(req, res) {
	User.findById(req.params.userId, function(err, user) {
		if(err)
		{
			res.send(404);
		}
		else
		{
			if(req.user.id==req.params.userId)
				res.send(200, user);
			else
				res.send(200, user.filter());
		}
	});
};

exports.findBeaconForUser=function(req, res) {

};