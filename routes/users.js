var _ = require('lodash');
var bcrypt = require('bcrypt');
var validator = require('validator');

var express = require('express');
var router = express.Router();

const CURSOS = [
  'Ciência da Computação', 
  'Engenharia de Computação',
  'Engenharia de Software',
  'Sistemas de Informação',
  'Análise e Desenvolvimento de Sistemas'
];

const FIELDS = [
  { 
    field: 'matricula', 
    required: true, 
    message: 'Preciso saber sua matricula :)', 
    format: '1111.1111.111-1',
    validator: function(value) { return validator.matches(value, /\d{4}.\d{4}.\d{3}-\d/gm); }
  },
  { 
    field: 'nome', 
    required: true, 
    message: 'Qual o nome da sua graça?',
    validator: function(value) { return true; }
  },
  { 
    field: 'email', 
    required: true, 
    message: 'E se que quiser te mandar alguns spans lol', 
    format: 'meu@email.com',
    validator: function(value) { return validator.isEmail(value); }
  },
  { 
    field: 'password', 
    required: true, 
    message: 'Proteja-se, não quero dar suas informações para outros', 
    format: '6+ caracteres',
    validator: function(value) { return value.length >= 6; }
  },
  { 
    field: 'curso', 
    required: true, 
    message: 'Qual sua turma?', 
    format: CURSOS,
    validator: function(value) { 
      return CURSOS.reduce((m,c) => m || (value.trim().toLowerCase() == c.trim().toLowerCase()), false); 
    }
  },
  { 
    field: 'apresentacao', 
    message: 'Apresente-se, queremos saber mais sobre você',
    validator: function(value) { return true; }
  },
  { 
    field: 'nascimento', 
    message: 'Quando nasceu?', 
    format: 'dd-mm-aaaa',
    validator: function(value) { return validator.matches(value, /\d{2}\/\d{2}\/\d{4}/gm); }
  },
  { 
    field: 'telefone', 
    message: 'Eu poderia passar trote no seu numero? Então me diz xD', 
    format: '(DDD) 11111-1111',
    validator: function(value) { return validator.matches(value, /\(\d{2,3}\) \d{5}-\d{4}/gm); }
  },
  { 
    field: 'termos', 
    required: true, 
    message: 'Você deve aceitar nossos termos de uso!', 
    format: 'checkbox',
    validator: function(value) { return true; }
  },
];

module.exports = function(db) {

  router.delete('/', async function(req, res, next) {
    if (req.body.email) { req.body.email = req.body.email.trim().toLowerCase(); }

    db.users.findOne({ email: req.body.email }, async function(err, doc) {
      if (!doc || !(await bcrypt.compare(req.body.password, doc.password))) {
        return res.status(400).render('users-feedback', { 
          title: 'Usuário não encontrado ou senha incorreta!',
          error: { not_found: true },
          partials: { head: 'head' }
        });
      }

      db.users.remove({ _id: doc._id }, function(err, n) {
        res.status(200).send('Usuário removido com sucesso!');
      });
    });
  });

  router.post('/', async function(req, res, next) {
    if (req.body.email) { req.body.email = req.body.email.trim().toLowerCase(); }
    
    db.users.findOne({ email: req.body.email }, async function(err, doc) {
      if (doc) {
        return res.status(400).render('users-feedback', { 
          title: 'Usuário já cadastrado!',
          error: { email: true },
          partials: { head: 'head' }
        });
      }

      var missing = [];

      FIELDS.forEach(function (element) {
        var value = req.body[element.field];
        if (!value || !(typeof value == 'string') || !element.validator(value)) { missing.push(element); }
      });

      var hasAllRequiredFields = missing.filter(m => m.required).length == 0;

      if (!(hasAllRequiredFields && (missing.length == 0 || req.body.incompleto))) {
        return res.status(400).render('users-feedback', { 
          title: 'Feedback do formulário',
          missing, 
          data: JSON.stringify(req.body, null, '  '),
          partials: { head: 'head' }
        });
      }

      req.body.password = await bcrypt.hash(req.body.password, 10);

      db.users.insert(req.body, (err, doc) => {
        res.render('users-feedback', { 
          title: 'Parabéns, seu cadastro foi realizado com sucesso!',
          missing, 
          data: JSON.stringify(doc, null, '  '),
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
  });

  return router;
};
