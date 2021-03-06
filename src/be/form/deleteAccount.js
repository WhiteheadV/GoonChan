'use strict';

var formOps = require('../engine/formOps');
var accountOps = require('../engine/accountOps');
var languageOps = require('../engine/langOps');
var lang = languageOps.languagePack;
var mandatoryParameters = [ 'account' ];

function deleteAccount(auth, parameters, userData, res, language) {

  if (formOps.checkBlankParameters(parameters, mandatoryParameters, res,
      language)) {
    return;
  }

  accountOps.deleteAccount(userData, parameters, language,
      function accountDeleted(error) {
        if (error) {
          formOps.outputError(error, 500, res, language);
        } else {
          formOps.outputResponse(lang(language).msgAccountDeleted,
              '/accounts.js', res, null, auth, language);
        }
      });
}

exports.process = function(req, res) {

  formOps.getAuthenticatedPost(req, res, true, function gotData(auth, userData,
      parameters) {
    deleteAccount(auth, parameters, userData, res, req.language);
  });
};