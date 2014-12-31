# heroku - route 53

[![npm status](http://img.shields.io/npm/v/route53-heroku.svg?style=flat)](https://www.npmjs.org/package/route53-heroku)
[![node version](https://img.shields.io/node/v/route53-heroku.svg?style=flat)](http://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/route53-heroku.svg?style=flat)](https://www.npmjs.org/package/route53-heroku)
[![dependency status](https://david-dm.org/philipheinser/route53-heroku.svg?style=flat)](https://david-dm.org/philipheinser/route53-heroku)
![license](https://img.shields.io/npm/l/route53-heroku.svg?style=flat)

Point your naked domain *example.com*, hostet on Route53, to your *example.herokuapp.com* Heroku App.

### Options:
```
{
	"aws": {
		"id": "*******",
		"key": "**************",
		"region": "eu-west-1",
		"zoneid": "*********",
		"name": "example.com"
	},
	"heroku": {
		"app": "example.herokuapp.com"
	}
}
```

### How to use:
Example.js
```
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
```
