var path = require('path'), 
  rootPath = path.normalize(__dirname + '/..'),
  templatePath = path.normalize(__dirname + '/../app/mailer/templates');

module.exports={
  development: {
    db: 'mongodb://localhost/warmerapp',
    root: rootPath,
    app: {
      name: 'Warmer'
    }
  },
  production: {
  }
};