var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/load', function(req, res, next) {

});

router.post('/login', function(req, res, next) {

});

router.get('/logout', function(req, res, next) {

});

router.get('/getuserinfo', function(req, res, next) {

});

router.put('/saveuserinfo', function(req, res, next) {

});

router.get('/getconversation/:friendid', function(req, res, next) {

});

router.post('/postmessage/:friendid', function(req, res, next) {

});

router.delete('/deletemessage/:msgid', function(req, res, next) {

});

router.get('/getnewmessages/:friendid', function(req, res, next) {

});

router.get('/getnewmsgnum/:friendid', function(req, res, next) {

});

module.exports = router;