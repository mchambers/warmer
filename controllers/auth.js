var auth=require("../services/jwt-auth"),
	Facebook=require('facebook-node-sdk'),
	mongoose=require('mongoose'),
	User=mongoose.model("User"),
	facebook=new Facebook({
								appID: "1409755942610414",
								secret: "8580938a7a9bd9d7c94602f0cba60b53"
							});

// Exchange a Facebook access token for 
// one of our access tokens.
exports.facebook=function(req, res) {
	if(!req.headers['authorization'])
	{
		console.log("No Authorization header present");
		res.send(400);
		return;
	}

	var fbAccessToken=null;
	fbAccessToken=req.headers['authorization'].split(" ")[1] || null;

	if(!fbAccessToken)
	{
		console.log("No access token present");
		res.send(400);
		return;
	}

	facebook.setAccessToken(fbAccessToken);

	facebook.api('/me', function(error, user) {
		if(error || !user)
		{
			console.log(error);
			res.send(401);
			return;
		}

		// once we know this is valid, we need to try and
		// look up one of our user records with their facebook ID

		// if we don't find an existing user for this FB account,
		// we just sign them up since that was clearly the intent.
		
		User.findOne({
			'social_connection.type':'facebook',
			'social_connection.user_id':user.id}, function(err, our_user) {
				if(!our_user || err)
				{
					console.log("Nobody found for this fella");

					var newUser=new User();
					newUser.name=user.first_name+" "+user.last_name[0]+".";
					newUser.gender=user.gender;
					newUser.social_connection.push({
						type: "facebook",
						user_id: user.id
					});
					newUser.pictureURL="http://graph.facebook.com/"+user.id+"/picture?width=500&height=500";

					newUser.save(function(err){
						if(err)
						{
							res.send(500);
						}
						else
						{
							var tokenSet=auth.TokenSetForCredential(newUser.id, "facebook", 604800000);
							tokenSet.user=newUser;
							res.send(201, tokenSet);
						}
					});

					return;
				}
				else
				{
					console.log("Found existing user, logging in");
					var tokenSet=auth.TokenSetForCredential(our_user.id, "facebook", 604800000);
					tokenSet.user=our_user;
					res.send(200, tokenSet);
				}
		});
	});
};