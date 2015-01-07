'use strict';

/**
 * Test dependencies.
 */
var vows = require('vows');
var assert = require('assert');

var Updater = require('../index');

vows.describe('The Good Things').addBatch({
  'A updater': {
    topic: function () {
      return new Updater({
        "aws": {
          "id": "id",
          "key": "key",
          "region": "eu-west-1",
          "zoneid": "zone-id",
          "name": "test.com"
        },
        "heroku": {
          "app": "test.herokuapp.com"
        }
      });
    },

    'is an Object': function (updater) {
      assert.isObject (updater);
    }
  }
}).export(module);
