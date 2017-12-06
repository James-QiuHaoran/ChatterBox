var chatterBox_app = angular.module('chatterBox', []);

chatterBox_app.controller('chatterBoxController', function($scope, $http, $interval) {
	// true for not logged in and false otherwise
	$scope.notLogin = true;

	// true for logged in and not select a user conversation, false otherwise
	$scope.notSelect = true;

	// current user information
	$scope.currentUser = {'username': '', 'icon': '', 'mobileNumber': "", "homeNumber": "", "address":""};

	// selected friend
	$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
	$scope.messages = [];

	// friend list, storing information of friends of the current user
	// each element in this array should have the same structure with selectedFriend
	$scope.friends = [];

	// true for user info page and false for conversation page
	$scope.isCurrentUser = false;

	// login error message
	$scope.loginErrorMsg = "Welcome to Chatter Box!";
/*
	// periodically update conversations for every 1 second
	$scope.promise = $interval(function() {
		if ($scope.notLogin === false) {
			$scope.updateConversations();
		}
	}, 1000);
*/

	$scope.userInput = {'username': '', 'password': ''};
	$scope.messageText = "";

	// load page information when index.html is loaded
	$scope.pageLoad = function() {
		$http.get("/load").then(function(response) {
			if (response.data === "") {
				// display login page
				$scope.notLogin = true;
				$scope.notSelect = true;
				$scope.currentUser = {'username': '', 'icon': '', 'mobileNumber': "", "homeNumber": "", "address":""};
				$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
				$scope.friends = [];
				$scope.messages = [];
				$scope.isCurrentUser = false;
				$scope.loginErrorMsg = "Welcome to Chatter Box!";
			} else {
				// display after login page or alert login error
				if (response.data.username) {
					// login successfully
					$scope.notLogin = false;
					$scope.notSelect = true;
					$scope.currentUser.username = response.data.username;
					$scope.currentUser.icon = response.data.icon;
					$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
					$scope.friends = response.data.friendList;
				} else {
					// display login error message
					alert(response.data);
				}
			}
		}, function(response) {
			alert("Error loading page.");
		});
	};

	// check login when sign-in button is clicked
	$scope.logIn = function() {
		if ($scope.userInput.username == "") {
			alert("Username cannot be empty!");
		} else if ($scope.userInput.password == "") {
			alert("Password cannot be empty!");
		} else {
			$http.post("/login", {"username": $scope.userInput.username, "password": $scope.userInput.password}).then(function(response) {
				console.log("Logging ... ");
				console.log(response.data);
				if (response.data == "Login Failure") {
					// login failed
					$scope.loginErrorMsg = response.data;
				} else {
					if (response.data.username) {
						// login succeeded
						$scope.notLogin = false;
						$scope.notSelect = true;
						$scope.currentUser.username = response.data.username;
						$scope.currentUser.icon = response.data.icon;
						$scope.friends = response.data.friendList;
						console.log($scope.friends);
						$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
					} else {
						alert(response.data.errorMessage);
					}
				}
			}, function(response) {
				alert("Error Login!");
			});
		}
	};

	// logout when log-out button is clicked
	$scope.logOut = function() {
		$http.get("/logout").then(function(response) {
			if (response.data === "") {
				// logout succeeded, restore to default values
				$scope.notLogin = true;
				$scope.notSelect = true;
				$scope.currentUser = {'username': '', 'icon': '', 'mobileNumber': "", "homeNumber": "", "address":""};
				$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
				$scope.friends = [];
				$scope.messages = [];
				$scope.isCurrentUser = false;
				$scope.loginErrorMsg = "Welcome to Chatter Box!";

				// set userInput model to empty
				$scope.userInput.username = "";
				$scope.userInput.password = "";
			} else {
				alert(response.data.errorMessage);
			}
		}, function(response) {
			alert("Error logout.");
		});
	};

	// display user info when the user icon is clicked
	$scope.displayUserInfo = function() {
		$scope.isCurrentUser = true;
		$scope.notSelect = true;
		$http.get("/getuserinfo").then(function(response) {
			if (response.data.errorMessage) {
				alert(response.data.errorMessage);
			} else {
				$scope.currentUser.mobileNumber = response.data.mobileNumber;
				$scope.currentUser.homeNumber = response.data.homeNumber;
				$scope.currentUser.address = response.data.address;
			}
		}, function(response) {
			alert("Error loading user information!")
		});
	};

	// update user info when save button is clicked
	$scope.updateUserInfo = function() {
		var bodyData = {"mobileNumber": $scope.currentUser.mobileNumber, "homeNumber": $scope.currentUser.homeNumber, "address": $scope.currentUser.address};
		$http.put("/saveuserinfo", bodyData).then(function(response) {
			if (response.data === "") {
				// save succeeded
				alert("User information successfully updated!")
			} else {
				alert(response.data.errorMessage);
			}
		}, function(response) {
			alert("Error saving user profile!");
		})
	};

	// load a conversation when the name of a friend is clicked
	$scope.loadConversation = function(friendID) {
		$scope.selectedFriend._id = friendID;
		$scope.notSelect = false;
		$scope.isCurrentUser = false;
		$http.get("/getconversation/" + friendID).then(function(response) {
			if (response.data.icon) {
				// successfully returned
				$scope.selectedFriend.username = response.data.username;
				$scope.selectedFriend.icon = response.data.icon;
				$scope.selectedFriend.status = response.data.status;
				$scope.messages = response.data.messages;
				for (var idx in $scope.messages) {
					if ($scope.messages[idx].senderId == $scope.selectedFriend._id)
						$scope.messages[idx].sentByMe = false;
					else
						$scope.messages[idx].sentByMe = true;
				}
				console.log($scope.messages);
			} else {
				alert(response.data.errorMessage);
			}
		}, function(response) {
			alert("Error getting conversation for current user!");
		});
	};

	// post a new message when the user type some text and press enter
	$scope.postNewMessage = function(friendID) {
		var date = Date().toString().slice(0, 15);
		var time = Date().toString().slice(15, 25);
		var bodyData = {
			'message': $scope.messageText,
			'date': date,
			'time': time
		};
		$http.post("/postmessage/" + friendID, bodyData).then(function(response) {
			if (response.data.errorMessage) {
				alert(response.data.errorMessage);
			} else {
				// successfully posted
				$scope.messageText = "";
				alert("Message successfully sent!");
				$scope.loadConversation(friendID);
			}
		}, function(response) {
			alert("Error posting new message!");
		});
	};

	// delete a message when a message is double clicked
	$scope.deleteMessage = function(msgID) {
		if (confirm("Are you show to delete this message?")) {
			$http.delete("/deletemessage/" + msgID).then(function(response) {
				if (response.data === "") {
					// successfully deleted
					// find the index to delete
					var messageToDelete = 0;
					for (var idx in $scope.messages) {
						if ($scope.messages[idx]._id === msgID) {
							messageToDelete = idx;
						}
					}
					// delete the message from the list
					$scope.messages.splice(messageToDelete, 1)
					$scope.loadConversation($selectedFriend._id);
					alert("Message successfully deleted!");
				} else {
					alert(response.data.errorMessage);
				}
			}, function(response) {
				alert("Error deleting a message!");
			});
		}
	};

	// update conversations periodically
	$scope.updateConversations = function() {
		// for selected friend
		$http.get("/getnewmessages/" + $scope.selectedFriend._id).then(function(response) {
			if (response.data.newMessages) {
				// successfully retrieved new nessages
				for (var idx in response.data.newMessages) {
					$scope.messages.append(response.data.newMessages[idx]);
				}
			} else {
				alert(response.data.errorMessage);
			}
		}, function(response) {
			alert("Error loading new messages for current conversation window!");
		});

		// for unselected friends in the list
		for (var idx in $scope.friends) {
			$http.get("/getnewmsgnum/" + $scope.friends[idx]).then(function(response) {
				if (response.data.errorMessage) {
					alert(response.data.errorMessage);
					$scope.friends[idx].unreadMsgNumber = '';
				} else {
					$scope.friends[idx].unreadMsgNumber = '(' + response.data + ')';
				}
			}, function(response) {
				alert("Error loading number of new messages for unselected friends!");
			});
		}
	};
});