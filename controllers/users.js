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

};

exports.findBeaconForUser=function(req, res) {

};