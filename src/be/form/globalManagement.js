'use strict';

var dom = require('../engine/domManipulator').dynamicPages.managementPages;
var formOps = require('../engine/formOps');
var jsonBuilder = require('../engine/jsonBuilder');
var url = require('url');
var miscOps = require('../engine/miscOps');

function getManagementData(userData, res, json, auth, language) {

  miscOps.getManagementData(userData.globalRole, language, userData.login,
      !json, function gotData(error, globalStaff, globalReports, appealedBans) {
        if (error) {
          formOps.outputError(error, 500, res, language);
        } else {

          res.writeHead(200, miscOps.corsHeader(json ? 'application/json'
              : 'text/html', auth));

          if (json) {
            res.end(jsonBuilder.globalManagement(userData.globalRole,
                userData.login, globalStaff, globalReports, appealedBans));
          } else {

            res.end(dom.globalManagement(userData.globalRole, userData.login,
                globalStaff, globalReports, appealedBans, language));
          }

        }
      });

}

exports.process = function(req, res) {

  formOps.getAuthenticatedPost(req, res, false, function gotData(auth,
      userData, parameters) {

    getManagementData(userData, res, url.parse(req.url, true).query.json, auth,
        req.language);

  });

};