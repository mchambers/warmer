
var PermissionService={
	CanGetUser: function(req,res,next) {
		if(req.userId==req.params.userId)
			next();
		else
			res.send(401);
	},
	CanPutUser: function(req,res,next) {
		if(req.userId==req.params.userId)
			next();
		else
			res.send(401);
	}
};

module.exports=PermissionService;