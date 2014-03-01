var jwt=require('jwt-simple');
var secret='com.approachlabs.warmer.{B9B039B0-C0B4-4145-9EE9-0B17AF5CFC9C}';
var moment=require("moment");

var JWTAuth={};

JWTAuth.TokenSetForCredential=function(username, password, expiresMs) {
		var expiry=new Date();
		expiry.setTime(expiry.getTime()+expiresMs);

		var tokenPayload={
			username: username,
			password: password,
			expires: expiry,
			type: "access_token"
		};

		var token=jwt.encode(tokenPayload, secret, "HS512");

		var refreshPayload={
			username: username,
			password: token,
			token_expired: expiry,
			type: "refresh_token"
		};

		var refresh=jwt.encode(refreshPayload, secret, "HS512");

		return {
			access_token: token,
			expires: expiry.getTime(),
			refresh_token: refresh
		};
};

JWTAuth.CredentialForToken=function(token) {
		try {
			return jwt.decode(token, secret);	
		}
		catch(e) {
			return null;
		}
};

JWTAuth.TokenSetForRefreshToken=function(token) {
		return null;
};

JWTAuth.EnsureNotAuthenticated=function(req, res, next) {
		if(req.params.access_token || req.headers.access_token)
		{
			res.send(400);
			return;
		}
		next();
};

JWTAuth.EnsureAuthenticated=function(req, res, next) {
		var accessToken;
		var decodedToken;

		// If we can't find a valid access token on this request,
		// return 401 Unauthorized.
		if(req.query['access_token'])
		{
			accessToken=req.query['access_token'];
		}
		else if(req.headers['access_token'])
		{
			accessToken=req.headers['access_token'];
		}
		else
		{
			res.send(401, "401 Missing Access Token");
			return;
		}

		decodedToken=JWTAuth.CredentialForToken(accessToken);

		// If we can't decode this token properly, it's expired,
		// or we can't find a username on it, return 401.
		var today=moment(Date.now);
		var tokenExpires=moment(decodedToken.expires);

		if(!decodedToken ||
			 !decodedToken.expires || 
			 (tokenExpires.isBefore(today)) || 
			 !decodedToken.username)
		{
			console.log(decodedToken);
			res.send(401, "401 Invalid Access Token");
			return;
		}

		// If we're still golden, set the valid token on the
		// request object and call next() so the user service
		// can append the user object via the user service.
		req.decodedAccessToken=decodedToken;
		req.userId=decodedToken.username;

		next();
};

module.exports=JWTAuth;