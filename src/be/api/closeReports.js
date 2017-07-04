'use strict';

var apiOps = require('../engine/apiOps');
var modOps = require('../engine/modOps').report;

function closeReports(auth, userData, parameters, res, language) {

  modOps.closeReports(userData, parameters, language, function reportClosed(
      error) {
    if (error) {
      apiOps.outputError(error, res);
    } else {
      apiOps.outputResponse(auth, null, 'ok', res);
    }
  });
}

exports.process = function(req, res) {

  apiOps.getAuthenticatedData(req, res, function gotData(auth, userData,
      parameters) {

    closeReports(auth, userData, parameters, res, req.language);
  });
};