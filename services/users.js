var mongoose=require('mongoose');

var UserService={
	LoadUserForRequest: function(req, res, next) {
		if(!req.userId)
		{
			// how the fuck did we wind up here?
			res.send(400, "Missing User ID");
			return;
		}

		var User=mongoose.model('User');
		User.findById(req.userId, function(err, user) {
			if(err)
			{
				res.send(401, "Token Valid for Missing or Otherwise Invalid User");
				return;
			}

			req.user=user;
			next();
		});
	}
};

module.exports=UserService;