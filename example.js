var nconf = require('nconf');
var Updater = require('route53-heroku');

//Setup Config
nconf
  .argv()
  .env()
  .file({ file: './config.json' });

var route53heroku = new Updater({
  aws: nconf.get('aws'),
  heroku: nconf.get('heroku')
});

route53heroku.on('newDNS', function (newDNS) {
  console.log(newDNS);
});

route53heroku.on('aws-response', function (res) {
  console.log(res);
});

route53heroku.start();