var _ = require('lodash');
var express = require('express');
var router = express.Router();

const FIELDS = [
  { field: 'matricula', type: 'required', message: 'Preciso saber sua matricula :)', format: '1111.1111.111-9' },
  { field: 'nome', type: 'required', message: 'Qual o nome da sua graça?' },
  { field: 'email', type: 'required', message: 'E se que quiser te mandar alguns spans lol', format: 'meu@email.com' },
  { field: 'curso', type: 'required', message: 'Qual sua turma?', format: '[CC|SI|ES|TADS]' },
  { field: 'apresentacao', type: 'optional', message: 'Apresente-se, queremos saber mais sobre você', format: 'livre' },
  { field: 'nascimento', type: 'optional', message: 'Quando nasceu?', format: 'dd-mm-aaaa' },
  { field: 'telefone', type: 'optional', message: 'Eu poderia passar trote no seu numero? Então me diz xD', format: '(DDD) 11111-1111' },
  { field: 'foto', type: 'optional', message: 'Quer virar modelo? Se mostre para o mundo', format: 'file' },
  { field: 'incompleto', type: 'required', message: 'Se não deseja informar tudo, aceite os termos de uso!', format: 'checkbox' },
];

module.exports = function(db) {

  router.post('/', function(req, res, next) {
    var missing = [];

    FIELDS.forEach(function (element) {
      if (!req.body[element.field]) { missing.push(element); }
    });

    console.log(missing);
    

    var hasAllRequiredFields = missing.reduce((m, c) => m && (c.type == 'optional'), true);

    if (!hasAllRequiredFields || (missing.length > 0 && !req.body.incompleto)) {
      return res.render('users-feedback', { 
        title: 'Feedback do formulário',
        missing, 
        data: res.body,
        partials: { head: 'head' }
      });
    }
    

    db.users.insert(req.body, (err, doc) => {
      res.render('users-feedback', { 
        title: 'Parabéns, seu cadastro foi realizado com sucesso!',
        missing, 
        data: doc,
        partials: { head: 'head' }
      });

      db.users.count({}, function (err, count) {
        if (err) { 
          return res.status(500).render('error', { message: 'Database error!', error: err }); 
        }
        req.app.get('socket.io').emit('users_update', count);
      });
    });
  });

  return router;
};
