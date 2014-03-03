var mongoose=require('mongoose');
var redis=require('../services/redis');

var Schema=mongoose.Schema;

var seekSchema=new Schema({
	seekedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
	seekingUserId: { type: Schema.Types.ObjectId, ref: 'User' },
	scanId: { type: Schema.Types.ObjectId, ref: 'Scan' },
	thumbId: { type: Schema.Types.ObjectId, ref: 'Thumb' },
	createdAt: {type: Date, default: Date.now},
});

mongoose.model("Seek", seekSchema);