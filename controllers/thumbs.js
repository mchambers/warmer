var redis=require('../services/redis'),
	mongoose=require('mongoose'),
	Thumb=mongoose.model('Thumb');

exports.create=function(req, res) {
	// so if we get a thumb here,
	// we can potentially have DOUBLE THUMBS

	// if that happens, we have a match and can begin homing
	// do we record that match? I think we should.

	var thumb=new Thumb({
		userId: req.userId,
		thumbedUserId: req.body.thumbedUserId,
		like: req.body.like,
		
	});
};