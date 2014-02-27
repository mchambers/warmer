var jwt=require('jwt-simple');
var secret='com.approachlabs.warmer.{B9B039B0-C0B4-4145-9EE9-0B17AF5CFC9C}';

var JWTAuth={
	TokenSetForCredential: function(username, password, expiresMs) {
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
	},
	CredentialForToken: function(token) {
		return jwt.decode(token, secret);
	},
	TokenSetForRefreshToken: function(token) {
		return null;
	}
};

module.exports=JWTAuth;