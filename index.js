'use strict';

/**
 * Module dependencies.
 */
var util = require('util');
var dns = require('dns');
var events = require('events');
var _ = require('underscore');
var AWS = require('aws-sdk');
var CronJob = require('cron').CronJob;

/**
 * Expose `Updater`.
 */
 module.exports = Updater;

/**
 * Validate global configuration.
 *
 * @api private
 */
function validateOptions(options) {
  if (!options.aws) throw new Error('options.aws required');
  if (!options.heroku) throw new Error('options.heroku required');
  if (!options.aws.id) throw new Error('options.aws.id required');
  if (!options.aws.key) throw new Error('options.aws.key required');
  if (!options.aws.region) throw new Error('options.aws.region required');
  if (!options.aws.zoneid) throw new Error('options.aws.zoneid required');
  if (!options.aws.name) throw new Error('options.aws.name required');
  if (!options.heroku.app) throw new Error('options.heroku.app required');
}

/**
 * Initialize a new `Updater` with options.
 *
 * Options:
 *
 *   - `aws.id` an aws access key ID with permissions to change a route53 resource
 *   - `aws.key` the aws secret access key for that ID
 *   - `aws.region` the aws region you working in
 *   - `aws.zoneid` the aws zoneid for the domain you want to point at heroku
 *   - `aws.name` the domain name eg. example.com
 *
 *   - `heroku.app` the domain of the heroku app eg. example.herokuapp.com
 *
 * @param {Object} [options]
 * @api public
 */
function Updater(options) {

  this.aws = options.aws;
  this.heroku = options.heroku;

  validateOptions(options);

  events.EventEmitter.call(this);

  // AWS Config
  AWS.config.update({accessKeyId: this.aws.id, secretAccessKey: this.aws.key});
  // Set your region for future requests.
  AWS.config.update({region: this.aws.region});

  // get the Route53 library
  this.route53 = new AWS.Route53();

  // Local vars
  this.addresses = {};
  this.lastDNS = [];

}

util.inherits(Updater, events.EventEmitter);

/**
 * Resolve an IP from Heroku and save it.
 *
 * @param {Function} [fn]
 * @api public
 */
Updater.prototype.lookForHerokuIPs = function() {
  var self = this;

  dns.resolve(self.heroku.app, function (err,  address) {
    if (err) throw err;

    address.forEach(function (val) {
      self.addresses[val] = new Date();
    });

    var newDNS = [];

    for (var key in self.addresses) {
      if(self.addresses.hasOwnProperty(key)){
        var isOld = ((self.addresses[key] - new Date) > 30000);
        if (isOld) {
          delete self.addresses[key];
        } else {
          newDNS.push(key);
        }
      }
    }

    var difference = _.difference(newDNS, self.lastDNS);

    if (difference.length === 0) {
      return;
    }

    self.lastDNS = newDNS;

    self.emit('newDNS', newDNS);

    self.updateRoute53IPs();

  });
};

Updater.prototype.updateRoute53IPs = function () {
  var self = this;

  var resourceRecords = [];

  this.lastDNS.forEach(function (val) {
    resourceRecords.push({
      'Value': val
    });
  });

  var params = {
    'HostedZoneId': '/hostedzone/'+this.aws.zoneid,
    'ChangeBatch': {
      'Changes': [
        {
          'Action': 'UPSERT',
          'ResourceRecordSet': {
            'Name': this.aws.name,
            'Type': 'A',
            'TTL': 300,
            'ResourceRecords': resourceRecords
          }
        }
      ]
    }
  };

  this.route53.changeResourceRecordSets(params, function(err,data) {

    if(self.listeners('error').length && err) {
      self.emit('error', err);
    } else if (err) {
      throw err;
    } else if (data) {
      self.emit('aws-response', data);
    }

  });
};

Updater.prototype.start = function () {
  var self = this;
  // Look Heroku IP every secound
  new CronJob('* * * * * *', function(){
      self.lookForHerokuIPs();
  }, null, true);
};

if (!module.parent) {
  var nconf = require('nconf');

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
  })

  route53heroku.start();
}

