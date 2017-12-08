var chatterBox_app = angular.module('chatterBox', []);

chatterBox_app.directive('schrollBottom', function () {
  return {
    scope: {
      schrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('schrollBottom', function (newValue) {
        if (newValue)
        {
          $(element).scrollTop($(element)[0].scrollHeight);
        }
      });
    }
  }
})
.controller('chatterBoxController', function($scope, $http, $interval) {
	// true for not logged in and false otherwise
	$scope.notLogin = true;

	// true for logged in and not select a user conversation, false otherwise
	$scope.notSelect = true;

	// current user information
	$scope.currentUser = {'username': '', 'icon': '', 'mobileNumber': "", "homeNumber": "", "address":""};

	// selected friend
	$scope.selectedFriend = {'username': '', '_id': '', 'icon': '', 'status': ''};
	$scope.messages = [];
	$scope.allMSGIDs = [];

	// friend list, storing information of friends of the current user
	// each element in this array should have the same structure with selectedFriend
	$scope.friends = [];

	// true for user info page and false for conversation page
	$scope.isCurrentUser = false;

	// login error message
	$scope.loginErrorMsg = "Welcome to Chatter Box!";

	// user inputs
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
				$scope.allMSGIDs = [];
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
				$scope.allMSGIDs = [];
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
				$scope.displayUserInfo();
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
		console.log($scope.selectedFriend._id);
		$scope.notSelect = false;
		$scope.isCurrentUser = false;
		$scope.messageText = "";
		$http.get("/getconversation/" + friendID).then(function(response) {
			if (response.data.icon) {
				// successfully returned
				$scope.selectedFriend.username = response.data.username;
				$scope.selectedFriend.icon = response.data.icon;
				$scope.selectedFriend.status = response.data.status;
				$scope.messages = response.data.messages;
				$scope.dates = [];
				for (var idx in $scope.messages) {
					if ($scope.messages[idx].onlydate == null) {
						if ($scope.messages[idx].senderId == $scope.selectedFriend._id)
							$scope.messages[idx].sentByMe = false;
						else
							$scope.messages[idx].sentByMe = true;	
						$scope.allMSGIDs.push($scope.messages[idx]._id);
					} else {
						$scope.dates.push($scope.messages[idx].date);
					}
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
				$scope.loadConversation(friendID);
				alert("Message successfully sent!");
			}
		}, function(response) {
			alert("Error posting new message!");
		});
	};

	// delete a message when a message is double clicked
	$scope.deleteMessage = function(msgID) {
		if (confirm("Are you sure to delete this message?")) {
			$http.delete("/deletemessage/" + msgID).then(function(response) {
				console.log("response: " + response.data);
				if (response.data === "") {
					// successfully deleted
					// find the index to delete
					var messageToDelete = 0;
					for (var idx in $scope.messages) {
						if ($scope.messages[idx].onlydate == null && $scope.messages[idx]._id === msgID) {
							messageToDelete = idx;
						}
					}
					// delete the message from the list
					console.log("message idx to delete is: " + messageToDelete);
					var idx_to_remove = $scope.allMSGIDs.indexOf(msgID);
					$scope.allMSGIDs.splice(idx_to_remove, 1);
					$scope.messages.splice(messageToDelete, 1)
					$scope.updateConversations();
					alert("Message successfully deleted!");
				} else {
					alert(response.data.errorMessage);
				}
			}, function(response) {
				alert("Error deleting a message!" +  response.status);
			});
		}
	};

	// update conversations periodically
	$scope.updateConversations = function() {
		// for selected friend
		if (!$scope.notSelect) {
			console.log($scope.selectedFriend._id);
			$http.get("/getnewmessages/" + $scope.selectedFriend._id).then(function(response) {
				if (response.data.allMessages) {
					// successfully retrieved all messages
					// update friend status
					$scope.selectedFriend.status = response.data.status;
					var allIDs = [];
					for (var idx = 0; idx < response.data.allMessages.length; idx++)
						allIDs.push(response.data.allMessages[idx]._id);

					// remove messages deleted by the other friend
					for (var idx = 0; idx < $scope.messages.length; idx++) {
						console.log("idx: " + idx + " message: " + $scope.messages[idx].onlydate);
						if (idx == ($scope.messages.length-1) && $scope.messages[idx].onlydate != null)
							$scope.messages.splice(idx, 1);
						else if (idx != ($scope.messages.length-2) && $scope.messages[idx].onlydate != null && $scope.messages[idx+1].onlydate != null) {
							var idx_to_remove = $scope.dates.indexOf($scope.messages[idx].date);
							$scope.dates.splice(idx_to_remove, 1);
							$scope.messages.splice(idx, 1);
							idx--;
						} else if ($scope.messages[idx].onlydate == null && allIDs.indexOf($scope.messages[idx]._id) == -1) {
							var idx_to_remove = $scope.allMSGIDs.indexOf($scope.messages[idx]._id);
							$scope.allMSGIDs.splice(idx_to_remove, 1);
							$scope.messages.splice(idx, 1);
							idx -= 2;
							if (idx < 0)
								idx = 0;
						}
					}

					// add new messages
					for (var idx = 0; idx < response.data.allMessages.length; idx++) {
						if ($scope.allMSGIDs.indexOf(response.data.allMessages[idx]._id) == -1) {
							// add to message list
							if ($scope.dates.indexOf(response.data.allMessages[idx].date) == -1) {
								$scope.messages.push({'onlydate': "onlydate", 'date': response.data.allMessages[idx].date});
								$scope.dates.push(response.data.allMessages[idx].date);
							}
							$scope.messages.push(response.data.allMessages[idx]);
							$scope.allMSGIDs.push(response.data.allMessages[idx]._id);
						}
					}
					$scope.loadConversation($scope.selectedFriend._id);
				} else {
					alert(response.data.errorMessage);
				}
			}, function(response) {
				alert("Error loading new messages for current conversation window!");
			});
		}

		// for friends in the list
		console.log($scope.friends);
		$scope.friends.forEach(function(friend) {
			$http.get("/getnewmsgnum/" + friend._id).then(function(response) {
				if (response.data.errorMessage) {
					alert(response.data.errorMessage);
					$scope.friend.unreadMsgNumber = '';
				} else {
					if (response.data.number > 0)
						friend.unreadMsgNumber = response.data.number;
					else
						friend.unreadMsgNumber = -1;
					console.log(" " + friend.name + " " + friend.unreadMsgNumber);
				}
			}, function(response) {
				alert("Error loading number of new messages for friend list!");
			});
		});
	};

	// periodically update the conversations
	$interval(function() {
		if ($scope.notLogin === false) {
			$scope.updateConversations();
		}
	}, 1000);
});