var express = require('express');
var router = express.Router();

/* Handle GET request for information of a user if session variable has been set, empty string otherwise. */
router.get('/load', function(req, res) {
	// test if session variable userID has been set
	if (req.session.userID) {
		var db = req.db;
		var name = "";
		var icon = "";
		var friendList = [];
		var userList = db.get("userList");

		// find out the user with userID specified by the session variable
		userList.find({'_id':req.session.userID}, {}, function(error, user) {
			if (error === null) {
				// dababase operation succeeded
				name = user[0].name;
				icon = user[0].icon;
				var friends = user[0].friends; // an array of name & lastMsgId pairs

				// find all friends of this user
				userList.find({}, {}, function(error, users) {
					if (error === null) {
						for (var idx in users) {
							var idxInFriends = -1;
							for (var friendIdx in friends) {
								if (friends[friendIdx].name === users[idx].name)
									idxInFriends = friendIdx;
							}
							if (idxInFriends != -1) {
								// this user is one of the friends of the previous user
								var lastMsgMine = friends[idxInFriends].lastMsgId;
								for (var friendIdx in users[idx].friends) {
									if (name === users[idx].friends[friendIdx])
										idxInFriends = friendIdx;
								}
								var lastMsgHis = users[idx].friends[idxInFriends].lastMsgId;
								var numUnreadMsgs = 0;
								if (lastMsgMine < lastMsgHis) {
									numUnreadMsgs = lastMsgHis - lastMsgMine;
								}
								friendList.push({'name': users[idx].name, '_id': users[idx]._id, 'numUnreadMsgs': numUnreadMsgs});
							}
						}
						res.json('username': name, 'icon': icon, 'friendList': friendList);
					} else {
						// database operation error
						res.send({'errorMessage': error});
					}
				});
			} else {
				// database operation error
				res.send({'errorMessage': error});
			}
		});
	} else {
		// send an empty string if no session found
		res.send("");
	}
});

/* Handle POST request to login. */
router.post('/login', bodyParser.json(), function(req, res) {
	var db = req.db;
	var name = "";
	var icon = "";
	var friendList = [];
	var userList = db.get("userList");

	userList.find({'name': req.body.username}, {}, function(error, loginUser) {
		if (error === null) {
			if ((loginUser.length > 0) && (loginUser[0].password === req.body.password)) {
				// the username exists and password matches
				// create a session variable
				req.session.userID = loginUser[0]._id;

				// update the status to be online
				userList.update({'name': req.body.username}, {'status': 'online'}, function(error, returnValue) {
					if (error === null) {
						res.send({'errorMessage': error});
					}
				});

				// send back information of this user
				name = loginUser[0].name;
				icon = loginUser[0].icon;
				var friends = loginUser[0].friends;

				// find all friends of this user
				userList.find({}, {}, function(error, users) {
					if (error === null) {
						for (var idx in users) {
							var idxInFriends = -1;
							for (var friendIdx in friends) {
								if (friends[friendIdx].name === users[idx].name)
									idxInFriends = friendIdx;
							}
							if (idxInFriends != -1) {
								// this user is one of the friends of the previous user
								var lastMsgMine = friends[idxInFriends].lastMsgId;
								for (var friendIdx in users[idx].friends) {
									if (name === users[idx].friends[friendIdx])
										idxInFriends = friendIdx;
								}
								var lastMsgHis = users[idx].friends[idxInFriends].lastMsgId;
								var numUnreadMsgs = 0;
								if (lastMsgMine < lastMsgHis) {
									numUnreadMsgs = lastMsgHis - lastMsgMine;
								}
								friendList.push({'name': users[idx].name, '_id': users[idx]._id, 'numUnreadMsgs': numUnreadMsgs});
							}
						}
						res.json('username': name, 'icon': icon, 'friendList': friendList);
					} else {
						// database operation error
						res.send({'errorMessage': error});
					}
				});
			} else {
				// login failure
				res.send("Login Failure");
			}
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

/* Handle GET request to logout. */
router.get('/logout', function(req, res) {
	// update status to be offline
	var db = req.db;
	var userList = db.get("userList");

	userList.find({'_id': req.session.userID}, {}, function(error, loginUser) {
		if (error === null) {
			// update the status to be offline
			userList.update({'_id': req.session.userID}, {'status': 'offline'}, function(error, returnValue) {
				if (error != null) {
					res.send({'errorMessage': error});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// unset the session variable
	req.session.userID = null;
	res.send("");
});

/* Handle GET request retrieving mobile number, home number, and address. */
router.get('/getuserinfo', function(req, res, next) {
	var db = req.db;
	var mobileNumber = "";
	var homeNumber = "";
	var address = "";
	var userList = db.get("userList");
	userList.find({'_id': req.session.userID}, {fields: {mobileNumber: 1, homeNumber: 1, address: 1}}, function(error, results) {
		if (error === null) {
			res.json({'mobileNumber': results[0].mobileNumber, 'homeNumber': results[0].homeNumber, 'address': results[0].address});
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

/* Handle PUT request for updating user information. */
router.put('/saveuserinfo', bodyParser.json(), function(req, res) {
	var db = req.db;
	var userList = db.get("userList");

	userList.find({'_id': req.session.userID}, {}, function(error, loginUser) {
		if (error === null) {
			// update the mobileNumber, homeNumber and address
			userList.update({'_id': req.session.userID}, {'mobileNumber': req.body.mobileNumber, 'homeNumber': req.body.homeNumber, 'address': req.body.address}, function(error, returnValue) {
				if (error != null) {
					res.send({'errorMessage': error});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// empty string is sent if successful
	res.send("");
});

/* Handle GET request for business between a particular friend and current user. */
router.get('/getconversation/:friendid', function(req, res) {
	var friendid = req.params.friendid;
	var myid = req.session.userID;
	var db = req.db;
	var userList = db.get("userList");
	var messageList = db.get("messageList");
	var icon = "";
	var status = "";
	var allMessages = [];
	var lastMsgId = "";
	var friendName = "";

	userList.find({'_id': friendid}, {}, function(error, friend) {
		if (error === null) {
			// get icon and status
			icon = friend[0].icon;
			status = friend[0].status;
			friendName = friend[0].name;

			// retrieve all messages
			messageList.find({'senderId': {$in: [friendid, myid]}, 'receiverId': {$in: [friendid, myid]}}, {}, function(error, messages) {
				if (error === null) {
					allMessages = messages;
					lastMsgId = messages[messages.length - 1]._id;
				} else {
					// database operation error
					res.send({'errorMessage': error});
				}
			});

			// update lastMsgId
			userList.update({'_id': myid, "friends.name": friendName}, {'friends.lastMsgId': lastMsgId}, function(error, returnValue) {
				if (error != null) {
					res.send({'errorMessage': error});
				}
			});

			// send json results
			res.json({'icon': icon, 'status': status, 'messages': messages});
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});


/* Handle POST request for posting new messages to friendid. */
router.post('/postmessage/:friendid', bodyParser.json(), function(req, res) {
	var friendid = req.params.friendid;
	var message = req.body.message;
	var date = req.body.date;
	var time = req.body.time;
	var db = req.db;
	var userList = db.get("userList");  // [TODO] do i have to update the lastid of mine ?
	var messageList = db.get("messageList");

	var objectToInsert = {'senderId': req.session.userID, 'receiverId': friendid, 'message': message, 'date': date, 'time': time};
	messageList.insert(objectToInsert, function(error, returnValue) {
		if (error === null) {
			res.send(objectToInsert._id);
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

/* Handle DELETE request for deleting a message by msgid. */
router.delete('/deletemessage/:msgid', function(req, res) {
	var db = req.db;
	var messageList = db.get("messageList");
	messageList.remove({'_id': req.params.msgid}, function(error, returnValue) {
		if (error === null) {
			res.send("");
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

/* Handle GET request for getting new messages from a friend. */
router.get('/getnewmessages/:friendid', function(req, res) {
	var friendid = req.params.friendid;
	var db = req.db;
	var userList = db.get("userList");
	var messageList = db.get("messageList");
	var friendName = "";
	var lastMsgId = "";

	// get the friend name
	userList.get({'_id': friendid}, function(error, name) {
		if (error === null) {
			friendName = name;
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// get the lastMsgId
	userList.get({'_id': req.session.userID, 'friends.name': friendName}, function(error, returnValue) {
		if (error === null) {
			lastMsgId = returnValue;
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// get unread messages
	messageList.get({'senderId': friendid, 'receiverId': req.session.userID, '_id':{$gt: lastMsgId}}, function(error, newMessages) {
		if (error === null) {
			// update lastMsgId
			lastMsgId = newMessages[newMessages.length - 1]._id;
			userList.update({'_id': req.session.userID, 'friends.name': friendName}, {'friends.lastMsgId': lastMsgId}, function(error, returnValue) {
				if (error === null) {
					res.send({'newMessages': newMessages});
				} else {
					// database operation error
					res.send({'errorMessage': error});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

/* Handle GET request for getting the number of new messages sent from the friend to this user. */
router.get('/getnewmsgnum/:friendid', function(req, res) {
	var friendid = req.params.friendid;
	var db = req.db;
	var userList = db.get("userList");
	var messageList = db.get("messageList");
	var friendName = "";
	var lastMsgId = "";
	var numberOfUnreadMsgs = "";

	// get the friend name
	userList.get({'_id': friendid}, function(error, name) {
		if (error === null) {
			friendName = name;
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// get the lastMsgId
	userList.get({'_id': req.session.userID, 'friends.name': friendName}, function(error, returnValue) {
		if (error === null) {
			lastMsgId = returnValue;
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});

	// get the number of unread messages
	messageList.count({'senderId': friendid, 'receiverId': req.session.userID, '_id':{$gt: lastMsgId}}, function(error, returnValue) {
		if (error === null) {
			numberOfUnreadMsgs = returnValue;
			res.send(numberOfUnreadMsgs);
		} else {
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

module.exports = router;