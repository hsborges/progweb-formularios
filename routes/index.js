var express = require('express');
var router = express.Router();

module.exports = function(db) {
  router.get('/', function(req, res, next) {
    res.render('index', {
      title: 'FACOM/UFMS - Programação para Web - Prof. Hudson Silva Borges',
      partials: { head: 'head' },
    });
  });
  return router;
};
