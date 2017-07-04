'use strict';

// handles miscellaneous pages

var jsdom = require('jsdom').jsdom;
var serializer = require('jsdom').serializeDocument;
var logger = require('../../../logger');
var debug = require('../../../kernel').debug();
var overboard;
var sfwOverboard;
var templateHandler;
var lang;
var common;
var miscOps;
var boardCreationRequirement;
var messageLength;

exports.optionalStringLogParameters = [ 'user', 'boardUri', 'after', 'before' ];

exports.accountSettingsRelation = {
  alwaysSignRole : 'checkboxAlwaysSign'
};

exports.loadSettings = function() {

  var settings = require('../../../settingsHandler').getGeneralSettings();

  messageLength = settings.messageLength;
  overboard = settings.overboard;
  sfwOverboard = settings.sfwOverboard;
  boardCreationRequirement = settings.boardCreationRequirement;

};

exports.loadDependencies = function() {

  templateHandler = require('../../templateHandler').getTemplates;
  lang = require('../../langOps').languagePack;

  common = require('..').common;
  miscOps = require('../../miscOps');

};

exports.error = function(code, message, language) {

  try {

    var document = jsdom(templateHandler(language).errorPage);

    document.title = lang(language).titError;

    document.getElementById('codeLabel').innerHTML = code;

    document.getElementById('errorLabel').innerHTML = message;

    return serializer(document);

  } catch (error) {

    return error.toString();

  }

};

exports.resetEmail = function(password, language) {

  try {

    var document = jsdom(templateHandler(language).resetEmail);

    var link = document.getElementById('labelNewPass');
    link.innerHTML = password;

    return serializer(document);
  } catch (error) {

    return error.toString();
  }
};

exports.recoveryEmail = function(recoveryLink, language) {

  try {

    var document = jsdom(templateHandler(language).recoveryEmail);

    var link = document.getElementById('linkRecovery');
    link.href = recoveryLink;

    return serializer(document);
  } catch (error) {

    return error.toString();
  }
};

// Section 1: Account {
exports.fillBoardsDiv = function(document, boardDiv, boardList) {

  if (!boardList || !boardList.length) {
    return;
  }

  for (var i = 0; i < boardList.length; i++) {
    var link = document.createElement('a');

    if (i) {
      boardDiv.appendChild(document.createElement('br'));
    }

    link.innerHTML = '/' + boardList[i] + '/';
    link.href = '/boardManagement.js?boardUri=' + boardList[i];

    boardDiv.appendChild(link);

  }

};

exports.setBoardCreationForm = function(userData, document) {

  var allowed = userData.globalRole <= boardCreationRequirement;

  if (boardCreationRequirement <= miscOps.getMaxStaffRole() && !allowed) {
    common.removeElement(document.getElementById('boardCreationDiv'));
  }
};

exports.setAccountSettingsCheckbox = function(settings, document) {

  if (!settings || !settings.length) {
    return;
  }

  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];

    var checkbox = document
        .getElementById(exports.accountSettingsRelation[setting]);

    checkbox.setAttribute('checked', true);
  }

};

exports.setTitleLoginAndStaff = function(document, userData, language) {

  document.title = lang(language).titAccount
      .replace('{$login}', userData.login);

  var loginLabel = document.getElementById('labelLogin');

  loginLabel.innerHTML = userData.login;

  var globalStaff = userData.globalRole <= miscOps.getMaxStaffRole();

  exports.setBoardCreationForm(userData, document);

  if (!globalStaff) {
    common.removeElement(document.getElementById('globalManagementLink'));
  }

};

exports.account = function(userData, language) {

  try {
    var document = jsdom(templateHandler(language).accountPage);

    exports.setTitleLoginAndStaff(document, userData, language);

    exports.setAccountSettingsCheckbox(userData.settings, document);

    if (userData.email && userData.email.length) {
      document.getElementById('emailField').setAttribute('value',
          userData.email);
    }

    exports.fillBoardsDiv(document, document.getElementById('ownedDiv'),
        userData.ownedBoards);

    exports.fillBoardsDiv(document, document.getElementById('volunteeredDiv'),
        userData.volunteeredBoards);

    return serializer(document);
  } catch (error) {

    return error.toString();
  }
};
// } Section 1: Account

// Section 2: Logs {
exports.setLogIndexCell = function(dateCell, date, language) {

  dateCell.setAttribute('class', 'logIndexCell');
  dateCell.innerHTML = templateHandler(language).logIndexCell;

  var link = dateCell.getElementsByClassName('dateLink')[0];
  link.innerHTML = common.formatDateToDisplay(date, true, language);

  link.href = '/.global/logs/' + logger.formatedDate(date) + '.html';

};

exports.logs = function(dates, language) {

  try {

    var document = jsdom(templateHandler(language).logIndexPage);

    document.title = lang(language).titLogs;

    var divDates = document.getElementById('divDates');

    for (var i = 0; i < dates.length; i++) {

      var dateCell = document.createElement('div');

      exports.setLogIndexCell(dateCell, dates[i], language);

      divDates.appendChild(dateCell);
    }

    return serializer(document);

  } catch (error) {

    return error.toString();
  }

};
// } Section 2: Logs

// Section 3: Board listing {
exports.setSimpleBoardCellLabels = function(board, boardCell) {

  var labelPPH = boardCell.getElementsByClassName('labelPostsPerHour')[0];
  labelPPH.innerHTML = board.postsPerHour || 0;

  var labelUniqueIps = boardCell.getElementsByClassName('labelUniqueIps')[0];
  labelUniqueIps.innerHTML = board.uniqueIps || 0;

  var labelCount = boardCell.getElementsByClassName('labelPostCount')[0];
  labelCount.innerHTML = board.lastPostId || 0;

  var labelDescription = boardCell.getElementsByClassName('divDescription')[0];
  labelDescription.innerHTML = board.boardDescription;

};

exports.setBoardCell = function(board, boardCell) {

  var linkContent = '/' + board.boardUri + '/ - ' + board.boardName;
  var boardLink = boardCell.getElementsByClassName('linkBoard')[0];
  boardLink.href = '/' + board.boardUri + '/';
  boardLink.innerHTML = linkContent;

  exports.setSimpleBoardCellLabels(board, boardCell);

  var labelTags = boardCell.getElementsByClassName('labelTags')[0];

  var specialSettings = board.specialSettings || [];

  if (specialSettings.indexOf('sfw') < 0) {
    common.removeElement(boardCell.getElementsByClassName('indicatorSfw')[0]);
  }

  if (!board.inactive) {
    var inactiveIndicator = boardCell
        .getElementsByClassName('indicatorInactive')[0];
    common.removeElement(inactiveIndicator);
  }

  if (board.tags) {
    labelTags.innerHTML = board.tags.join(', ');
  } else {
    common.removeElement(labelTags);
  }
};

exports.getBoardPageLinkBoilerPlate = function(parameters) {

  var href = '';

  if (parameters.boardUri) {
    href += '&boardUri=' + parameters.boardUri;
  }

  if (parameters.sfw) {
    href += '&sfw=1';
  }

  if (parameters.tags) {
    href += '&tags=' + parameters.tags;
  }

  if (parameters.inactive) {
    href += '&inactive=1';
  }

  if (parameters.sorting) {
    href += '&sorting=' + parameters.sorting;
  }

  return href;

};

exports.setPages = function(parameters, document, pageCount) {
  var pagesDiv = document.getElementById('divPages');

  var boilerPlate = exports.getBoardPageLinkBoilerPlate(parameters);

  for (var j = 1; j <= pageCount; j++) {

    var link = document.createElement('a');
    link.innerHTML = j;
    link.href = '/boards.js?page=' + j + boilerPlate;

    pagesDiv.appendChild(link);
  }
};

exports.setBoards = function(boards, document, language) {

  var divBoards = document.getElementById('divBoards');

  for (var i = 0; i < boards.length; i++) {
    var board = boards[i];

    var boardCell = document.createElement('div');
    boardCell.innerHTML = templateHandler(language).boardsCell;
    boardCell.setAttribute('class', 'boardsCell');

    exports.setBoardCell(board, boardCell);

    divBoards.appendChild(boardCell);
  }

};

exports.setOverboardLinks = function(document) {

  var linkOverboard = document.getElementById('linkOverboard');

  if (overboard) {
    linkOverboard.href = '/' + overboard + '/';
  } else {
    common.removeElement(linkOverboard);
  }

  var linkSfwOverboard = document.getElementById('linkSfwOver');

  if (sfwOverboard) {
    linkSfwOverboard.href = '/' + sfwOverboard + '/';
  } else {
    common.removeElement(linkSfwOverboard);
  }

};

exports.boards = function(parameters, boards, pageCount, language) {
  try {
    var document = jsdom(templateHandler(language).boardsPage);

    document.title = lang(language).titBoards;

    exports.setOverboardLinks(document);

    exports.setBoards(boards, document, language);

    exports.setPages(parameters, document, pageCount);

    return serializer(document);

  } catch (error) {

    return error.toString();
  }

};
// } Section 3: Board listing

// Section 4: Ban {
exports.setBanPage = function(document, ban, board, language) {

  document.getElementById('boardLabel').innerHTML = board;

  if (ban.range) {
    document.getElementById('rangeLabel').innerHTML = ban.range.join('.');
  } else {

    document.getElementById('reasonLabel').innerHTML = ban.reason;

    document.getElementById('idLabel').innerHTML = ban._id;

    ban.expiration = common.formatDateToDisplay(ban.expiration, null, language);
    document.getElementById('expirationLabel').innerHTML = ban.expiration;

    if (ban.appeal) {
      common.removeElement(document.getElementById('formAppeal'));
    } else {

      var identifier = document.getElementById('idIdentifier');
      identifier.setAttribute('value', ban._id);

    }

  }

};

exports.ban = function(ban, board, language) {

  try {

    var templateToUse;

    if (ban.range) {
      templateToUse = templateHandler(language).rangeBanPage;
    } else {
      templateToUse = templateHandler(language).banPage;
    }

    var document = jsdom(templateToUse);

    document.title = lang(language).titBan;

    exports.setBanPage(document, ban, board, language);

    return serializer(document);

  } catch (error) {

    return error.toString();

  }

};
// } Section 4: Ban

// Section 5: Hash ban page {
exports.setHashBanCells = function(document, hashBans, language) {

  var panel = document.getElementById('hashBansPanel');

  for (var i = 0; i < hashBans.length; i++) {

    var hashBan = hashBans[i];

    var cell = document.createElement('div');
    cell.innerHTML = templateHandler(language).hashBanCellDisplay;
    cell.setAttribute('class', 'hashBanCellDisplay');

    cell.getElementsByClassName('labelFile')[0].innerHTML = hashBan.file;

    var boardLabel = cell.getElementsByClassName('labelBoard')[0];

    boardLabel.innerHTML = hashBan.boardUri || lang(language).miscAllBoards;

    panel.appendChild(cell);

  }

};

exports.hashBan = function(hashBans, language) {

  try {

    var document = jsdom(templateHandler(language).hashBanPage);

    document.title = lang(language).titHashBan;

    exports.setHashBanCells(document, hashBans, language);

    return serializer(document);

  } catch (error) {

    return error.toString();
  }

};
// } Section 5: Hash ban page

// Section 7: Edit page {
exports.setEditIdentifiers = function(parameters, document) {

  if (parameters.threadId) {
    document.getElementById('threadIdentifier').setAttribute('value',
        parameters.threadId);

    common.removeElement(document.getElementById('postIdentifier'));

  } else {
    document.getElementById('postIdentifier').setAttribute('value',
        parameters.postId);
    common.removeElement(document.getElementById('threadIdentifier'));
  }

};

exports.edit = function(parameters, message, language) {
  try {

    var document = jsdom(templateHandler(language).editPage);

    document.getElementById('labelMessageLength').innerHTML = messageLength;

    document.title = lang(language).titEdit;

    document.getElementById('fieldMessage').defaultValue = message;

    document.getElementById('boardIdentifier').setAttribute('value',
        parameters.boardUri);

    exports.setEditIdentifiers(parameters, document);

    return serializer(document);

  } catch (error) {

    return error.toString();
  }
};
// } Section 7: Edit page

// Section 8: No cookie captcha {
exports.setCaptchaIdAndImage = function(document, captchaId) {

  var captchaPath = '/captcha.js?captchaId=' + captchaId;
  document.getElementById('imageCaptcha').src = captchaPath;

  document.getElementById('inputCaptchaId').setAttribute('value', captchaId);

};

exports.noCookieCaptcha = function(parameters, captchaId, language) {

  try {

    var document = jsdom(templateHandler(language).noCookieCaptchaPage);

    document.title = lang(language).titNoCookieCaptcha;

    if (!parameters.solvedCaptcha) {
      common.removeElement(document.getElementById('divSolvedCaptcha'));
    } else {
      var labelSolved = document.getElementById('labelCaptchaId');
      labelSolved.innerHTML = parameters.solvedCaptcha;
    }

    exports.setCaptchaIdAndImage(document, captchaId);

    return serializer(document);

  } catch (error) {

    return error.toString();
  }

};
// } Section 8: No cookie captcha

exports.blockBypass = function(valid, language) {

  try {

    var document = jsdom(templateHandler(language).bypassPage);

    document.title = lang(language).titBlockbypass;

    if (!valid) {
      common.removeElement(document.getElementById('indicatorValidBypass'));
    }

    return serializer(document);

  } catch (error) {

    return error.toString();
  }
};

// Section 9: Graphs {
exports.setGraphIndexCell = function(dateCell, date, language) {

  dateCell.setAttribute('class', 'graphIndexCell');
  dateCell.innerHTML = templateHandler(language).graphIndexCell;

  var link = dateCell.getElementsByClassName('dateLink')[0];
  link.innerHTML = common.formatDateToDisplay(date, true, language);

  link.href = '/.global/graphs/' + logger.formatedDate(date) + '.png';

};

exports.graphs = function(dates, language) {

  try {

    var document = jsdom(templateHandler(language).graphsIndexPage);

    document.title = lang(language).titGraphs;

    var divDates = document.getElementById('divDates');

    for (var i = 0; i < dates.length; i++) {

      var dateCell = document.createElement('div');

      exports.setGraphIndexCell(dateCell, dates[i], language);

      divDates.appendChild(dateCell);
    }

    return serializer(document);

  } catch (error) {

    return error.toString();
  }

};
// } Section 9: graphs

exports.message = function(message, link, language) {

  try {

    var document = jsdom(templateHandler(language).messagePage);

    document.title = message;

    var messageLabel = document.getElementById('labelMessage');

    messageLabel.innerHTML = message;

    var redirectLink = document.getElementById('linkRedirect');

    redirectLink.href = link;

    return serializer(document);
  } catch (error) {

    return error.toString();
  }

};