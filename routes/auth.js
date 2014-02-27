var auth=require("../modules/jwt-auth");
var Facebook=require('facebook-node-sdk');

var facebook=new Facebook({
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

		// if we can't find one, we need to send back a 404
		// so the client knows this *WAS* a valid Facebook token,
		// but the user isn't present on our system.

		var tokenSet=auth.TokenSetForCredential(user.id, req.params.access_token, 604800000);

		res.send(tokenSet);
	});
};