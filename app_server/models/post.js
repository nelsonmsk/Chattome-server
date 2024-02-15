const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
	text: {
		type: String,
		trim: true,
		required: 'text is required'
	},
	photo: {
		data: Buffer,
		contentType: String
	},
	postedBy: [{type: mongoose.Schema.ObjectId,ref: 'User'}],	
	created: {
		type: Date,
		default: Date.now()
	},
	likes: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
	comments: [{
		text: String,
		created: { type: Date, default: Date.now },
		postedBy: { type: mongoose.Schema.ObjectId, ref: 'User'}
		}]
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;