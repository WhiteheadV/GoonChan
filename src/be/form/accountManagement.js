'use strict';

var formOps = require('../engine/formOps');
var miscOps = require('../engine/miscOps');
var jsonBuilder = require('../engine/jsonBuilder');
var url = require('url');
var domManipulator = require('../engine/domManipulator').dynamicPages;
domManipulator = domManipulator.managementPages;
var accountOps = require('../engine/accountOps');

function getAccount(auth, userData, res, req) {

  var parameters = url.parse(req.url, true).query;

  var json = parameters.json;
  var account = parameters.account;

  var language = req.language;

  accountOps.getAccountData(account, userData, language,
      function gotAccountData(error, accountData) {

        if (error) {

          formOps.outputError(error, 500, res, language);

        } else {

          res.writeHead(200, miscOps.corsHeader(json ? 'application/json'
              : 'text/html', auth));

          if (json) {
            res.end(jsonBuilder.accountManagement(accountData));
          } else {
            res.end(domManipulator.accountManagement(accountData, account,
                userData.globalRole, language));
          }

        }

      });

}

exports.process = function(req, res) {

  formOps.getAuthenticatedPost(req, res, false,
      function gotData(auth, userData) {
        getAccount(auth, userData, res, req);
      });

};