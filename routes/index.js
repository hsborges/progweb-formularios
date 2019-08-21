var express = require('express');
var router = express.Router();


module.exports = function(db) {
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'ProWeb-2019/2', partials: { head: 'head' } });
  });
  return router;
};
