var dns = require('dns');
var _ = require('underscore');
var AWS = require('aws-sdk');
var nconf = require('nconf');
var CronJob = require('cron').CronJob;

//Setup Config
nconf
  .argv()
  .env()
  .file({ file: './config.json' });

// AWS Config
AWS.config.update({accessKeyId: nconf.get('aws:id'), secretAccessKey: nconf.get('aws:key')});
// Set your region for future requests.
AWS.config.update({region: 'aws:region'});

// get the Route53 library
var route53 = new AWS.Route53();

// Local vars
var addresses = {};
var lastDNS = [];

function setDNS() {
  dns.resolve(nconf.get('heroku:app'), function (err,  address) {
    if (err) throw err;

    address.forEach(function (val) {
      addresses[val] = new Date;
    });

    var newDNS = [];

    for (var key in addresses) {
      if(addresses.hasOwnProperty(key)){
        var isOld = ((addresses[key] - new Date) > 30000);
        if (isOld) {
          delete addresses[key];
        } else {
          newDNS.push(key)
        }
      }
    }

    var difference = _.difference(newDNS, lastDNS);

    if (difference.length === 0) {
      return;
    };

    lastDNS = newDNS;

    console.log(newDNS);

    var resourceRecords = [];

    newDNS.forEach(function (val) {
      resourceRecords.push({
        'Value': val
      })
    })

    var params = {
      'HostedZoneId': '/hostedzone/'+nconf.get('aws:zoneid'),
      'ChangeBatch': {
        'Changes': [
          {
            'Action': 'UPSERT',
            'ResourceRecordSet': {
              'Name': nconf.get('aws:name'),
              'Type': 'A',
              'TTL': 300,
              'ResourceRecords': resourceRecords
            }
          }
        ]
      }
    };

    route53.changeResourceRecordSets(params, function(err,data) {
      console.log(err,data);
    });

  });
}

// Look Heroku IP every secound
new CronJob('* * * * * *', function(){
    setDNS()
}, null, true);
  