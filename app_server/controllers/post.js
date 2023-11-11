/*main controller */

const express = require('express');
const router = express.Router();
const User = require('./../models/user.js'); 
const Post = require('./../models/post.js'); 
const extend = require('lodash/extend');
const errorHandler = require('./../../db/helpers/dbErrorHandler');
const formidable = require('formidable');
const fs = require('fs');
const profileImage = ('./../../../client/src/assets/images/profile-pic.jpg');

	/* create new user. */
	const create = (req, res, next) => {
		let form = new formidable.IncomingForm();
		form.keepExtensions = true;
		form.parse(req, async (err, fields, files) => {
			if (err) {
				return res.status(400).json({
					error: "Image could not be uploaded"
				});
			}
			let post = new Post(fields);
			post.postedBy= req.profile;
			if(files.photo){
				post.photo.data = fs.readFileSync(files.photo.path);
				post.photo.contentType = files.photo.type;
			}
			try {
				let result = await post.save();
				res.json(result);
			} catch (err) {
				return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
				});
			}
		})
	};
	
	const update = async (req, res) => {
		let form = new formidable.IncomingForm();
		form.keepExtensions = true;
		form.parse(req, async (err, fields, files) => {
			if (err) {
				return res.status(400).json({
					error: "Photo could not be uploaded"
				});
			}
			let user = req.profile;
			user = extend(user, fields);
			user.updated = Date.now();
			if(files.photo){
				user.photo.data = fs.readFileSync(files.photo.path);
				user.photo.contentType = files.photo.type;
			}
			try {
				await user.save();
				user.hashed_password = undefined;
				user.salt = undefined;
				res.json(user);
			} catch (err) {
				return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
				});
			}
		});
	};
	
	const remove = async (req, res) => {
		try {
			let post = req.profile;
			let deletedPost = await post.remove();
			res.json(deletedPost);
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const isPoster = (req, res, next) => {
		let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id;
		if(!isPoster){
			return res.status('403').json({
				error: "User is not authorized"
			});
		}
		next();
	};

	const photo = (req, res, next) => {
			res.set("Content-Type", req.profile.photo.contentType);
			return res.send(req.profile.photo.data);
	};

	const postByID = async (req, res, next, id) => {
		try{
			let post = await Post.findById(id)
									.populate('postedBy', '_id name')
									.exec();
			if (!post)
				return res.status('400').json({
		 			error: "Post not found"
				});
			req.post = post;
			next();
		}catch(err){
			return res.status('400').json({
				error: "Could not retrieve use post"
			});
		}
	};

	const like = async (req, res) => {
		try {
			let result = await Post.findByIdAndUpdate(req.body.postId,
										{$push: {likes: req.body.userId}},
										{new: true});
			res.json(result);
		} catch(err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const unlike = async (req, res) => {
		try {
		let result = await Post.findByIdAndUpdate(req.body.postId,
										{$pull: {likes: req.body.userId}},
										{new: true});
			res.json(result);
		}catch(err) {
			return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const comment = async (req, res) => {
		let comment = req.body.comment;
		comment.postedBy = req.body.userId;
		try {
			let result = await Post.findByIdAndUpdate(req.body.postId,
											{$push: {comments: comment}},
											{new: true})
									.populate('comments.postedBy', '_id name')
									.populate('postedBy', '_id name')
									.exec();
			res.json(result);
		}catch(err){
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const uncomment = async (req, res) => {
		let comment = req.body.comment;
		try{
			let result = await Post.findByIdAndUpdate(req.body.postId,
													{$pull: {comments: {_id: comment._id}}},
													{new: true})
									.populate('comments.postedBy', '_id name')
									.populate('postedBy', '_id name')
									.exec();
			res.json(result);
		} catch(err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};


	const listNewsFeed = async (req, res) => {
		let following = req.profile.following;
		following.push(req.profile._id);
		try {
		 	let posts = await Post.find({postedBy:{ $in : req.profile.following }})
									.populate('comments.postedBy', '_id name')
									.populate('postedBy', '_id name')
									.sort('-created')
									.exec();
			res.json(posts);
		} catch(err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const listByUser = async (req, res) => {
		try {
			let posts = await Post.find({postedBy: req.profile._id})
									.populate('comments.postedBy', '_id name')
									.populate('postedBy', '_id name')
									.sort('-created')
									.exec();
			res.json(posts);
		} catch(err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};


module.exports = {
	create,
	isPoster,
	update,
	remove, 
	photo,
	postByID,
	like,
	unlike,
	comment,
	uncomment,
	listNewsFeed,
	listByUser
};
