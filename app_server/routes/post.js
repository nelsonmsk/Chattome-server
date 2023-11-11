const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const authCtrl = require('../controllers/auth');
const postCtrl = require('../controllers/post');

router.route('/api/posts/feed/:userId')
	.get(authCtrl.requireSignin, postCtrl.listNewsFeed);

router.param('userId', userCtrl.userByID);

router.route('/api/posts/by/:userId')
	.get(authCtrl.requireSignin, postCtrl.listByUser);

router.route('/api/posts/new/:userId')
	.post(authCtrl.requireSignin, postCtrl.create);

router.route('/api/posts/photo/:postId').get(postCtrl.photo);

router.param('postId', postCtrl.postByID);

router.route('/api/posts/:postId')
	.delete(authCtrl.requireSignin, postCtrl.isPoster, postCtrl.remove);

router.route('/api/posts/like')
	.put(authCtrl.requireSignin, postCtrl.like);

router.route('/api/posts/unlike')
	.put(authCtrl.requireSignin, postCtrl.unlike);

router.route('/api/posts/comment')
	.put(authCtrl.requireSignin, postCtrl.comment);

router.route('/api/posts/uncomment')
	.put(authCtrl.requireSignin, postCtrl.uncomment);
	
module.exports = router;
