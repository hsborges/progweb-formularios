var express = require('express');
var router = express.Router();
var Datastore = require('nedb');

router.post('/', function(req, res, next) {
  console.log(req.body);
  res.sendStatus(201);
});

module.exports = router;
