'use strict';

var domManipulator = require('../engine/domManipulator').staticPages;
var db = require('../db');
var boards = db.boards();
var url = require('url');
var threads = db.threads();
var flags = db.flags();
var lang = require('../engine/langOps').languagePack;
var posts = db.posts();
var miscOps = require('../engine/miscOps');
var jsonBuilder = require('../engine/jsonBuilder');
var modOps = require('../engine/modOps').common;
var formOps = require('../engine/formOps');

function outputModData(bData, flagData, thread, posts, res, json, userRole,
    auth, language) {

  var header = miscOps.corsHeader(json ? 'application/json' : 'text/html');

  if (auth && auth.authStatus === 'expired') {
    header.push([ 'Set-Cookie', 'hash=' + auth.newHash ]);
  }

  res.writeHead(200, header);

  if (json) {

    res.end(jsonBuilder.thread(bData.boardUri, bData, thread, posts, null,
        true, userRole, flagData));

  } else {

    domManipulator.thread(bData.boardUri, bData, flagData, thread, posts,
        function gotThreadContent(error, content) {
          if (error) {
            formOps.outputError(error, 500, res, language);
          } else {

            res.end(content);
          }
        }, true, userRole, language);
  }

}

function getPostingData(boardData, flagData, parameters, res, json, userRole,
    auth, language) {

  threads.findOne({
    threadId : +parameters.threadId,
    boardUri : boardData.boardUri
  }, {
    _id : 0,
    subject : 1,
    threadId : 1,
    flag : 1,
    boardUri : 1,
    locked : 1,
    cyclic : 1,
    clearCache : 1,
    hashedCache : 1,
    alternativeCaches : 1,
    flagCode : 1,
    flagName : 1,
    pinned : 1,
    lastEditTime : 1,
    lastEditLogin : 1,
    autoSage : 1,
    creation : 1,
    id : 1,
    banMessage : 1,
    ip : 1,
    name : 1,
    signedRole : 1,
    files : 1,
    email : 1,
    message : 1,
    markdown : 1
  },
      function gotThread(error, thread) {
        if (error) {
          formOps.outputError(error, 500, res, language);
        } else if (!thread) {
          formOps.outputError(lang(language).errThreadNotFound, 500, res,
              language);
        } else {

          // style exception, too simple
          posts.find({
            threadId : +parameters.threadId,
            boardUri : boardData.boardUri
          }, {
            _id : 0,
            signedRole : 1,
            subject : 1,
            ip : 1,
            flagCode : 1,
            creation : 1,
            boardUri : 1,
            flagName : 1,
            clearCache : 1,
            hashedCache : 1,
            flag : 1,
            alternativeCaches : 1,
            threadId : 1,
            lastEditTime : 1,
            lastEditLogin : 1,
            id : 1,
            postId : 1,
            message : 1,
            name : 1,
            files : 1,
            email : 1,
            banMessage : 1,
            markdown : 1
          }).sort({
            creation : 1
          }).toArray(
              function gotPosts(error, posts) {
                if (error) {
                  formOps.outputError(error, 500, res, language);
                } else {
                  outputModData(boardData, flagData, thread, posts, res, json,
                      userRole, auth, language);
                }

              });

          // style exception, too simple
        }

      });

}

function getFlags(board, parameters, res, json, userRole, auth, language) {

  flags.find({
    boardUri : parameters.boardUri
  }, {
    name : 1
  }).sort({
    name : 1
  }).toArray(
      function gotFlags(error, flagData) {
        if (error) {
          formOps.outputError(error, 500, res, language);
        } else {
          getPostingData(board, flagData, parameters, res, json, userRole,
              auth, language);
        }
      });

}

exports.process = function(req, res) {

  formOps.getAuthenticatedPost(req, res, false,
      function gotData(auth, userData) {

        var parameters = url.parse(req.url, true).query;

        if (formOps.checkBlankParameters(parameters,
            [ 'boardUri', 'threadId' ], res, req.language)) {
          return;
        }

        parameters.boardUri = parameters.boardUri.toString();

        var globalStaff = userData.globalRole <= miscOps.getMaxStaffRole();

        // style exception, too simple
        boards.findOne({
          boardUri : parameters.boardUri
        }, {
          owner : 1,
          _id : 0,
          boardUri : 1,
          ipSalt : 1,
          boardName : 1,
          maxFiles : 1,
          maxFileSizeMB : 1,
          settings : 1,
          captchaMode : 1,
          boardMarkdown : 1,
          usesCustomCss : 1,
          boardDescription : 1,
          volunteers : 1
        }, function gotBoard(error, board) {
          if (error) {
            formOps.outputError(error, 500, res, req.language);
          } else if (!board) {
            formOps.outputError(lang(req.language).errBoardNotFound, 500, res,
                req.language);
          } else if (!modOps.isInBoardStaff(userData, board) && !globalStaff) {
            formOps.outputError(lang(req.language).errDeniedManageBoard, 500,
                res, req.language);
          } else {
            getFlags(board, parameters, res, parameters.json,
                userData.globalRole, auth, req.language);
          }
        });
        // style exception, too simple

      });

};