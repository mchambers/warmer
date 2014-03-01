
var PermissionService={
	EnsurePermissions: function(req,res,next) {
		next();
	}
};

module.exports=PermissionService;