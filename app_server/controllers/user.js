/*main controller */

const express = require('express');
const router = express.Router();
const User = require('./../models/user.js'); 
const extend = require('lodash/extend');
const errorHandler = require('./../../db/helpers/dbErrorHandler');
const formidable = require('formidable');
const fs = require('fs');
const profileImage = ('./../../../client/src/assets/images/profile-pic.jpg');

	/* create new user. */
	const create = async (req, res) => {
		const user = new User(req.body);
		let existing_user = await User.findOne({ "email": req.body.email });		
		if (existing_user){
			return res.status(401).json({ error: "User already exists" });
		}else{
			try {	
				await user.save();
				return res.status(200).json({
					message: "Successfully signed up!"
				})
			} catch (err) {
				return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
				})
			}
		}
	};
	
	
	const list = async (req, res) => {
		try {
			let users = await User.find().select('name email updated created');
			res.json(users);
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};	
	
	const userByID = async (req, res, next, id) => {
		try {
			let user = await User.findById(id)
				.populate('following', '_id name')
				.populate('followers', '_id name')
				.exec();	
			if (!user)
				return res.status(400).json({
					error: "User not found"
				});
			req.profile = user;
			next();
		} catch (err) {
			return res.status(400).json({
				error: "Could not retrieve user"
			});
		}
	};
	
	const read = (req, res) => {
		req.profile.hashed_password = undefined;
		return res.json(req.profile);
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
				let data = [];
				if(fields){
					if(fields.name) data['name'] = fields.name.toLocaleString();
					if(fields.about) data['about'] = fields.about.toLocaleString();	
					if(fields.email) data['email'] = fields.email.toLocaleString();
					if(fields.password) data['password'] = fields.password.toLocaleString();
					if(fields.following) data['following'] = fields.following.toLocaleString();	
					if(fields.followers) data['followers'] = fields.followers.toLocaleString();						
				}
				user = extend(user, data);
				user.updated = Date.now();
				if(files.photo){
					user.photo.data = fs.readFileSync(files.photo.path);
					user.photo.contentType = files.photo.type;
				}
				try {
					await user.save();
					user.hashed_password = undefined;
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
			let id = req.profile._id;				
			await User.findByIdAndDelete(id);
			return res.status(200).json({
					message: "Successfully deleted user:" + id.toLocaleString()
				})
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			})
		}
	};
	
	const photo = (req, res, next) => {
		if(req.profile.photo.data){
			res.set("Content-Type", req.profile.photo.contentType);
			return res.send(req.profile.photo.data);
		}
	next();
	};
	
	const defaultPhoto = (req, res) => {
		return res.sendFile(process.cwd()+ profileImage);
	};

	const addFollowing = async (req, res, next) => {
		try{	
			let stats = false;
			let user = await User.findById(req.body.userId);			
			if(user){
				let folArray = user.following;
				folArray.map((val)=>{
					if(val.toLocaleString() == req.body.followId){
						return stats = true;
					}
				});			
				if(stats == true){
					return res.status(400).json({
						error: "Already following this user "
					});					
				}else{
					await User.findByIdAndUpdate(req.body.userId,
						{$push: {following: req.body.followId}});
					next();
				}
			}
		}catch(err){
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const addFollower = async (req, res) => {
		try{
			let result = await User.findByIdAndUpdate(req.body.followId,
										{$push: {followers: req.body.userId}},
										{new: true})
								.populate('following', '_id name')
								.populate('followers', '_id name')
								.exec();
			result.hashed_password = undefined;
			res.json(result);
		}catch(err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const removeFollowing = async (req, res, next) => {
		try{
			let stats = false;
			let user = await User.findById(req.body.userId);			
			if(user){
				let folArray = user.following;
				folArray.map((val)=>{
					if(val.toLocaleString() == req.body.unfollowId){
						return stats = true;
					}
				});	
				if(stats == false){
					return res.status(400).json({
						error: "User not found "
					});					
				}else{
					await User.findByIdAndUpdate(req.body.userId,
						{$pull: {following: req.body.unfollowId}});
					next();
				}
			}
		}catch(err) {
			return res.status(400).json({
					error: errorHandler.getErrorMessage(err) 
			});
		}
	};
	
	const removeFollower = async (req, res) => {
		try{
			let result = await User.findByIdAndUpdate(req.body.unfollowId,
										{$pull: {followers: req.body.userId}},
										{new: true})
									.populate('following', '_id name')
									.populate('followers', '_id name')
									.exec();
			result.hashed_password = undefined;
			res.json(result);
		}catch(err){
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

	const findPeople = async (req, res) => {
		let following = req.profile.following;
		following.push(req.profile._id);
		try {
			let users = await User.find({ _id:{ $nin : following }})
									.select('name');
			res.json(users);
		}catch(err){
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};

module.exports = {
	create,
	list,
	userByID,
	read,
	update,
	remove, 
	photo,
	defaultPhoto,
	addFollower,
	addFollowing,
	removeFollower,
	removeFollowing,
	findPeople
};
