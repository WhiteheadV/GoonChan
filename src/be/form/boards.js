'use strict';

var boards = require('../db').boards();
var miscOps = require('../engine/miscOps');
var formOps = require('../engine/formOps');
var jsonBuilder = require('../engine/jsonBuilder');
var domManipulator = require('../engine/domManipulator').dynamicPages.miscPages;
var settingsHandler = require('../settingsHandler');
var url = require('url');

function getTags(parameters) {

  var tags = [];

  var rawTags = parameters.tags.split(',');

  for (var i = 0; i < rawTags.length; i++) {
    var tag = rawTags[i].trim().toLowerCase();

    if (tag.length) {
      tags.push(tag);
    }
  }

  return tags;

}

function getQueryBlock(parameters) {

  var queryBlock = {};

  if (parameters.boardUri && parameters.boardUri.length) {
    queryBlock.boardUri = {
      $regex : parameters.boardUri
    };
  } else {
    delete parameters.boardUri;
  }

  if (parameters.sfw) {
    queryBlock.specialSettings = 'sfw';
  }

  if (parameters.inactive) {
    queryBlock.inactive = true;
  }

  if (parameters.tags && parameters.tags.length) {

    queryBlock.tags = {
      $all : getTags(parameters)
    };

  } else {
    delete parameters.tags;
  }

  queryBlock.settings = {
    $not : {
      $elemMatch : {
        $in : [ 'unindex' ]
      }
    }
  };

  return queryBlock;

}

function getSortBlock(parameters) {

  switch (parameters.sorting) {

  case '1':
    return {
      uniqueIps : 1,
      postsPerHour : 1,
      lastPostId : 1
    };

  case '2':
    return {
      lastPostId : -1
    };

  case '3':
    return {
      lastPostId : 1
    };

  case '4':
    return {
      postsPerHour : -1
    };

  case '5':
    return {
      postsPerHour : 1
    };

  case '6':
    return {
      boardUri : 1
    };

  case '7':
    return {
      boardUri : -1
    };

  default:
    return {
      uniqueIps : -1,
      postsPerHour : -1,
      lastPostId : -1
    };
  }
}

exports.process = function(req, res) {

  var parameters = url.parse(req.url, true).query;

  var page = parameters.page || 1;

  var queryBlock = getQueryBlock(parameters);

  var pageSize = settingsHandler.getGeneralSettings().boardsPerPage;

  boards.count(queryBlock, function(error, count) {
    if (error) {
      formOps.outputError(error, 500, res, req.language);
    } else {
      var pageCount = Math.ceil(count / pageSize);

      pageCount = pageCount || 1;

      var toSkip = (parameters.page - 1) * pageSize;

      // style exception, too simple
      boards.find(queryBlock, {
        _id : 0,
        boardName : 1,
        boardUri : 1,
        inactive : 1,
        specialSettings : 1,
        uniqueIps : 1,
        tags : 1,
        boardDescription : 1,
        postsPerHour : 1,
        lastPostId : 1
      }).sort(getSortBlock(parameters)).skip(toSkip).limit(pageSize).toArray(
          function(error, foundBoards) {
            if (error) {
              formOps.outputError(error, 500, res, req.language);
            } else {
              var json = parameters.json;

              res.writeHead(200, miscOps.corsHeader(json ? 'application/json'
                  : 'text/html'));

              if (json) {
                res.end(jsonBuilder.boards(pageCount, foundBoards));
              } else {
                res.end(domManipulator.boards(parameters, foundBoards,
                    pageCount, req.language));
              }

            }
          });
      // style exception, too simple

    }
  });
};