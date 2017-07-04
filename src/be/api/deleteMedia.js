'use strict';

var apiOps = require('../engine/apiOps');
var mediaHandler = require('../engine/mediaHandler');

function deleteMedia(parameters, userData, auth, res, language) {

  mediaHandler.deleteFiles(parameters.identifiers, userData, language,
      function deletedFiles(error) {

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

    deleteMedia(parameters, userData, auth, res, req.language);
  });

};