# ChatterBox
A simple single-page social chat application using the MEAN stack (MongoDB, Express.JS, AngularJS, and Node.js).

## Documentation for the Application - ChatterBox:

Author: Qiu Haoran
Date: 2017.12.08
UID: 3035234478

If there's any problem or anything unclear, please email jamesqiu@hku.hk! Thank you very much!


## Structure of Submission Files

- app.js
- package.json
- ./routes/chats.js
- ./public/index.html
- ./public/javascripts/myscripts.js
- ./public/stylesheets/mystyles.js
- ./public/images/
- ./public/icons/

### app.js
In app.js, the router module is loaded and set to be the handler for localhost:3000. MongoDB is loaded and a database instance of assignment2 is created to be used for all middlewares. Other modules are loaded for bodyParser, session, and favicon. Added middleware to serve requests for static files under public directory.

### package.json
All dependencies needed in this application are included in package.json.

### ./routes/chats.js
1. GET '/load'
If session variable userID is set, then 
	- find the user from database table userList, get his name and icon, as well as his friend list
	- for each friend in his friend list, find the particular user from database table userList, get the last message ID, his name and ID. Then form a query to count the number of unread messages sent from this friend to the current user (whose ID are greater than last message ID).
	- return a json message which includes username, icon, and friendList. friendList is a list of name, _id, and numUnreadMsgs.
	- if there's any error, return a json message `{'errorMessage': the_error_message}`.
Otherwise, an empty string is sent.
2. POST '/login' (body: username, password)
Find the particular user according to the username,
	- if found, and the passwords matches,
		- set the session variable userID to be the user's _id.
		- update status to be "online".
		- for each friend in the user's friend list, find the particular user from database table userList, get the last message ID, his name and ID. Then form a query to count the number of unread messages sent from this friend to the current user (whose ID are greater than last message ID).
		- return a json message which includes username, icon, and friendList. friendList is a list of name, _id, and numUnreadMsgs.
	- otherwise "Login Failure" is returned.
If any error happens in the process, return a json message `{'errorMessage': the_error_message}`.
3. GET '/logout'
Find the user regarding the session variable userID,
- if succeeds, update the status to be 'offline'. Unset the session variable userID to be null and send back an empty string.
- otherwise, return a json message `{'errorMessage': the_error_message}`.
4. GET '/getuserinfo'
Find the user regarding the session variable userID, retrieve the mobile number, home number and address from database table userList. If any error occurs, return a json message `{'errorMessage': the_error_message}`.
5. PUT '/saveuserinfo' (body: mobileNumber, homeNumber, address)
Find the user according to the userID stored as session variable, if the user exists, update the mobile number, home number and address. If any error occurs, return a json message `{'errorMessage': the_error_message}`.
6. GET '/getconversation/:friendid'
- Find the friend from database table userList according to the friendid, and then get icon, status and name.
- Find all messages from database table messageList sent between the two users.
	- if there's no message, send back a json message including username, icon, status, and an empty message list.
	- otherwise, first use the last message's id as the new lastMsgId and then update current user's friend list (in userList), set this friend's lastMsgId to be the new one. Then scan through message list, split all distinct dates to single items in the same message list (for future display in index.html).
- Set the currentFriend.userID to be this friend's _id, and currentFriend.name to be this friend's name.
- Send back a json message including username, icon, status and messages.
- If there's any error occurs, return a json message `{'errorMessage': the_error_message}`.
7. POST '/postmessage/:friendid' (body: message, date, time)
Insert the message record to database table messageList, using session variable userID as the senderId, friendid as the receiverId. If success, then send back the newly inserted message's id. If there's any error occurs, return a json message `{'errorMessage': the_error_message}`.
8. DELETE '/deletemessage/:msgid'
- Delete the message record from database table messageList according to the msgid in URL. If there's any error occurs, return a json message `{'errorMessage': the_error_message}`.
- Note that, if the one deleted is the last message loaded by that friend, then the lastMsgId should be udpated, this function is implemented in '/getnewmessages' endpoint.
9. GET '/getnewmessages/:friendid'
Find the particular friend from database table userList according to the friendid in URL, get the status.
- if succeeds, use session variable userID and friend name to find the lastMsgId from database table userList.
	- if succeeds, find the all messages sent from the friend to the current user from database table messageList.
		- if succeeds, find update the lastMsgId of this friend to current user in userList.
			- if succeeds, send the json message of the messages and friend status.
			- otherwise, return a json message `{'errorMessage': the_error_message}`.
		- otherwise, return a json message `{'errorMessage': the_error_message}`.
	- otherwise, return a json message `{'errorMessage': the_error_message}`.
- otherwise, return a json message `{'errorMessage': the_error_message}`.
10. GET '/getnewmsgnum/:friendid'
Find the particular friend from database table userList according to the friendid in URL. 
- if succeeds, use session variable userID and friend name to find the lastMsgId from database table userList.
	- if succeeds, counts the number of unread messages sent from the friend to the current user from database table messageList (id greater than lastMsgId).
		- if succeeds, send the json message of numberOfUnreadMsgs.
		- otherwise, return a json message `{'errorMessage': the_error_message}`.
	- otherwise, return a json message `{'errorMessage': the_error_message}`.
- otherwise, return a json message `{'errorMessage': the_error_message}`.

In the end, export this module for the use in app.js.

### ./public/index.html
Structure of the webpage:
- body
	- header
	- 'before-login' division
		- error message
		- username
		- password
		- sign in button
	- 'after-login' division
		- welcome message
			- username
			- user icon
			- log out button
		- friend list
			- friend name
			- number of unread messages
		- conversation division / user info division
			- friend icon and status
			- messages and their time, separated by date
			- text area

### ./public/javascripts/myscripts.js
'scrollBottom' directive: used for conversation window, always start from the bottom. To see older conversation history, scroll up.

'chatterBoxController' controller:
Scope Variables:
- notLogin: true for not logged in, false otherwise
- notSelete: true for not seleted any friend, false otherwise
- currentUser: stores information about current logged in user
- selectedFriends: stores information about selected friend
- messages: message list with the current friend
- friends: friend list of current logged in user
- isCurrentUser: true for clicked user's icon, in user profile page, false otherwise
- loginErrorMsg: display welcome message when loaded, error message when there's any login failure
- userInput consists of username and password (input by the user).
- messageText is the message entered by the user.

Scope Methods:
pageLoad()
Send http request to '/load' endpoint, if the response.data is an empty string, then display login page by setting all scope variables to be the defalut value. Otherwise, set corresponding scope variables by using data in response. If there's any error, display the error message by alert.

logIn()
If username or password is empty, alert the user to input them. Then send http request to '/login' by adding username and password as body parameters. If response is "Login Failure" then display error message. Otherwise, the same logic as page load.

logOut()
Send http request to '/logout' endpoint, if the response is an empty string, then set all scope variables to default value. Otherwise, alert the error message.

displayUserInfo()
Send http request to '/getuserinfo', if there's any error message, alert it. Otherwise, set currentUser's info to be the corresponding information in response data.

updateUserInfo()
Send http request to '/saveuserinfo' and add mobileNumber, homeNumber, address to body parameters. Upon success, display "Successfully updated", display error message otherwise.

loadConversation(friendID)
Send http request to '/getconversation', set information about selectedFriend upon success, display error messages otherwise. Set the attributes of messages according to who sent this message and wether this message is only a date (for displaying date in index.html).

postNewMessage(friendID)
Send http request to '/postmessage' and add message, date and time to body parameters. Upon success, call updateConversations to show new messages. If there's any error, display error messages.

deleteMessage(msgID)
Send http request to 'deletemessage' and then remove the message from message list upon success. If there's any error, display error message.

updateConversation()
For current friend, send http request to '/getnewmessages' endpoint and update the message list, if needed, update the status of the friend. For friends in the friend list, send http request to 'getnewmsgnum' endpoint and set unreadMsgNumber of the friend to be the response data upon success and display error message otherwise.

### ./public/stylesheets/mystyles.js
CSS style file.

### ./public/images/
All images and favicons used in index.html are included in this directory.

### ./public/icons/
All user icons used by registered users are included in this directory.


## Instructions to Run the Application

1. Create an Express project.
2. Copy all the files in the folder to the project created.
3. Switch to the express project folder, install all dependencies by executing "npm install".
4. Set up a mongodb database with name "assignment2".
5. Use "npm start" to start the express project and goto localhost:3000 for testing.