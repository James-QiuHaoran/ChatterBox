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
		var messageList = db.get("messageList");

		// find out the user with userID specified by the session variable
		userList.find({'_id':req.session.userID}, {}, function(error, user) {
			if (error === null) {
				// dababase operation succeeded
				name = user[0].name;
				icon = user[0].icon;
				var friends = user[0].friends; // an array of name & lastMsgId pairs

				friends.forEach(function(friend) {
					// find the friend info
					userList.find({'name': friend.name},{}, function(error, results) {
						if (error === null) {
							var lastMsgMine = friend.lastMsgId; // the last message the current user has read from that user
							var friendName = friend.name;
							var friendID = results[0]._id;
							var query = {'senderId': friendID, 'receiverId': req.session.userID, '_id': {$gt: lastMsgMine}};
							if (lastMsgMine == "0")
								query = {'senderId': friendID, 'receiverId': req.session.userID};

							// count the number of unread messages
							messageList.count(query, function(error, numberOfUnreadMsgs) {
								if (error === null) {
									friendList.push({'name': friendName, '_id': friendID, 'unreadMsgNumber': numberOfUnreadMsgs});
									if (friends.length == friendList.length) {
										res.json({'username': name, 'icon': icon, 'friendList': friendList});
									}
								} else {
									res.send({'errorMessage': error + " - Error finding the number of unread messages!"});
								}
							});
						} else {
							res.send({'errorMessage': error + " - Error loading user list!"});
						}
					});
				});
			} else {
				// database operation error
				res.send({'errorMessage': error + " - Error loading user list!"});
			}
		});
	} else {
		// send an empty string if no session found
		res.send("");
	}
});

/* Handle POST request to login. */
router.post('/login', function(req, res) {
	var db = req.db;
	var friendList = [];
	var userList = db.get("userList");
	var messageList = db.get("messageList");

	userList.find({'name': req.body.username}, {}, function(error, loginUser) {
		if (error === null) {
			if ((loginUser.length > 0) && (loginUser[0].password == req.body.password)) {
				// the username exists and password matches
				// create a session variable
				req.session.userID = loginUser[0]._id;

				// update the status to be online
				userList.update({'name': req.body.username}, {$set:{'status': 'online'}}, function(error, returnValue) {
					if (error != null) {
						res.send({'errorMessage': error + " - Error updating status to online."});
					}
				});

				var friends = loginUser[0].friends;
				friends.forEach(function(friend) {
					userList.find({'name': friend.name},{}, function(error, results) {
						if (error === null) {
							var lastMsgMine = friend.lastMsgId; // the last message the current user has read from that user
							var friendName = friend.name;
							var friendID = results[0]._id;
							var query = {'senderId': friendID, 'receiverId': req.session.userID, '_id': {$gt: lastMsgMine}};
							if (lastMsgMine == "0")
								query = {'senderId': friendID, 'receiverId': req.session.userID};
							messageList.count(query, function(error, numberOfUnreadMsgs) {
								if (error === null) {
									friendList.push({'name': friendName, '_id': friendID, 'unreadMsgNumber': numberOfUnreadMsgs});
									if (friends.length == friendList.length) {
										res.json({'username': loginUser[0].name, 'icon': loginUser[0].icon, 'friendList': friendList});
									}
								} else {
									res.send({'errorMessage': error + " - Error finding the number of unread messages!"});
								}
							});
						} else {
							res.send({'errorMessage': error + " - Error loading user list!"});
						}
					});
				});
			} else {
				// login failure
				res.send("Login Failure");
			}
		} else {
			// database operation error
			res.send({'errorMessage': error + " - Error loading user list."});
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
			userList.update({'_id': loginUser[0]._id}, {$set:{'status': 'offline'}}, function(error, returnValue) {
				if (error != null) {
					res.send({'errorMessage': error + " - Error updating status of this user!"});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error + " - Error finding this user in user list!"});
		}
	});

	// unset the session variable
	req.session.userID = null;
	res.send("");
});

/* Handle GET request retrieving mobile number, home number, and address. */
router.get('/getuserinfo', function(req, res) {
	var db = req.db;
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
router.put('/saveuserinfo', function(req, res) {
	var db = req.db;
	var userList = db.get("userList");

	userList.find({'_id': req.session.userID}, {}, function(error, loginUser) {
		if (error === null) {
			// update the mobileNumber, homeNumber and address
			userList.update({'_id': req.session.userID}, {$set:{'mobileNumber': req.body.mobileNumber, 'homeNumber': req.body.homeNumber, 'address': req.body.address}}, function(error, returnValue) {
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
					if (messages === null || messages.length == 0) {
						res.json({'username': friendName, 'icon': icon, 'status': status, 'messages': []});
					} else {
						lastMsgId = messages[messages.length - 1]._id;
						allMessages = messages;

						var date = "";
						for (var idx = 0; idx < allMessages.length; idx++) {
							if (allMessages[idx].date != date) {
								date = allMessages[idx].date;
								allMessages.splice(idx, 0, {'onlydate':"onlydate", 'date':date});
								idx++;
							}
						}
						// update lastMsgId
						userList.update({'_id': myid, "friends.name": friendName}, {$set:{'friends.$.lastMsgId': lastMsgId}}, function(error, returnValue) {
							if (error != null) {
								res.send({'errorMessage': error + " - Error updating lastMsgId!"});
							} else {
								res.json({'username': friendName, 'icon': icon, 'status': status, 'messages': allMessages});
							}
						});
					}
				} else {
					// database operation error
					res.send({'errorMessage': error + " - Error retrieving message list!"});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error + " - Error retrieving user list!"});
		}
	});
});


/* Handle POST request for posting new messages to friendid. */
router.post('/postmessage/:friendid', function(req, res) {
	var friendid = req.params.friendid;
	var message = req.body.message;
	var date = req.body.date;
	var time = req.body.time;
	var db = req.db;
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
	var userList = db.get("userList");

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
	var friendStatus = "";
	var lastMsgId = "";

	// get the friend name
	userList.find({'_id': friendid}, function(error, users) {
		if (error === null) {
			friendName = users[0].name;
			friendStatus = users[0].status;

			// get all messages
			messageList.find({'senderId': {$in: [friendid, req.session.userID]}, 'receiverId': {$in: [friendid, req.session.userID]}}, function(error, allMessages) {
				if (error === null) {
					res.send({'allMessages': allMessages, 'status': friendStatus});
					// update the lastMsgId
					messageList.find({'senderId': friendid, 'receiverId': req.session.userID}, function(error, messages) {
						if (error === null) {
							// update lastMsgId
							if (messages.length == 0) {
								lastMsgId = '0';
							} else {
								lastMsgId = messages[messages.length - 1]._id;
							}
							var query = {$set : {'friends.$.lastMsgId' : lastMsgId}};
							userList.update({'_id' : req.session.userID, 'friends.name' : friendName}, query, function(err, docs){
								if (err === null) {} else {res.send({'msg' : err});}
							});
						}
					});
				} else {
					// database operation error
					res.send({'errorMessage': error + " - Error loading message list!"});
				}
			});
		} else {
			// database operation error
			res.send({'errorMessage': error + " - Error loading user list!"});
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
	userList.find({'_id': friendid}, {}, function(error, records) {
		if (error === null) {
			friendName = records[0].name;
			// get the lastMsgId
			userList.find({'_id': req.session.userID}, {}, function(error, users) {
				if (error === null) {
					var user = users[0];
					//res.json(user.friends);
					user.friends.forEach(function(friend) {
						if (friend.name == friendName) {
							lastMsgId = friend.lastMsgId;
						}
					});
					
					// get the number of unread messages
					var query = {'senderId': friendid, 'receiverId': req.session.userID, '_id': {$gt: lastMsgId}};
					if (lastMsgId == "0")
						query = {'senderId': friendid, 'receiverId': req.session.userID};
					messageList.count(query, function(error, returnValue) {
						if (error === null) {
							numberOfUnreadMsgs = returnValue;
							res.json({number: numberOfUnreadMsgs, lastMsgId: lastMsgId});
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
			// database operation error
			res.send({'errorMessage': error});
		}
	});
});

module.exports = router;