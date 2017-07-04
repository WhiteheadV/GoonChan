'use strict';

var formOps = require('../engine/formOps');
var lang = require('../engine/langOps').languagePack;
var logger = require('../logger');
var modOps = require('../engine/modOps').ipBan.specific;
var mandatoryParameters = [ 'banId', 'appeal' ];

function appealBan(ip, parameters, res, language) {

  if (formOps.checkBlankParameters(parameters, mandatoryParameters, res,
      language)) {
    return;
  }

  modOps.appealBan(ip, parameters, language, function banAppealed(error) {
    if (error) {
      formOps.outputError(error, 500, res, language);
    } else {
      formOps.outputResponse(lang(language).msgBanAppealed, '/', res, null,
          null, language);
    }
  });

}

exports.process = function(req, res) {

  formOps.getPostData(req, res, function gotData(auth, parameters) {

    appealBan(logger.ip(req), parameters, res, req.language);

  });

};