var _ = require('lodash');
var bcrypt = require('bcrypt');
var validator = require('validator');

var express = require('express');
var router = express.Router();


module.exports = function (db) {

  router.post('/', function(req, res, next) {
    if (req.body.email) { req.body.email = req.body.email.trim().toLowerCase(); }
 
    db.users.findOne({ email: req.body.email }, async function(err, doc) {
      if (!doc) {
        return res.status(200).render('users-details', {
          title: 'Usuário não encontrado ou senha incorreta!', 
          partials: { head: 'head' }
        });
      }

      var id = doc._id;
      var isSame = await bcrypt.compare(req.body.password, doc.password);
      if (isSame) { doc = _.map(doc, function(value,key) { return { field: _.capitalize(key), value: value }; }); };

      return res.status(200).render('users-details', {
        title: 'Usuário encontrado!',
        data: isSame ? doc : null,
        id, 
        partials: { head: 'head' }
      });
    });
  });

  return router;
};
