module.exports={
	log: function(message, subsystem) {
		if(typeof subsystem === 'undefined') subsystem="Warmer";
		console.log("["+subsystem+"]: " + message);
	}
};