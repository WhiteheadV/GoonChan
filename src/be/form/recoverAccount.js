'use strict';

var url = require('url');
var db = require('../db');
var accountOps = require('../engine/accountOps');
var lang = require('../engine/langOps').languagePack;
var formOps = require('../engine/formOps');

exports.process = function(req, res) {

  var parameters = url.parse(req.url, true).query;

  accountOps.recoverAccount(parameters, req.language,
      function recoveredAccount(error) {
        if (error) {
          formOps.outputError(error, 500, res, req.language);
        } else {
          formOps.outputResponse(lang(req.language).msgPasswordReset,
              '/account.js', res, null, null, req.language);
        }

      });

};