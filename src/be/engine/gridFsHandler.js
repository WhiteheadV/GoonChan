'use strict';

// handles every gridfs operation.

var fs = require('fs');
var db = require('../db');
var files = db.files();
var chunks = db.chunks();
var bucket = new (require('mongodb')).GridFSBucket(db.conn());
var disable304;
var verbose;
var alternativeLanguages;
var miscOps;
var zlib = require('zlib');

var permanentTypes = [ 'media', 'graph' ];

exports.loadSettings = function() {

  var settings = require('../settingsHandler').getGeneralSettings();

  disable304 = settings.disable304;
  verbose = settings.verbose || settings.verboseGridfs;
  alternativeLanguages = settings.useAlternativeLanguages;
};

exports.loadDependencies = function() {
  miscOps = require('./miscOps');
};

exports.removeDuplicates = function(uploadStream, callback) {

  files.aggregate([ {
    $match : {
      _id : {
        $ne : uploadStream.id
      },
      $or : [ {
        filename : uploadStream.filename
      }, {
        'metadata.referenceFile' : uploadStream.filename
      } ]
    }
  }, {
    $group : {
      _id : 0,
      ids : {
        $push : '$_id'
      }
    }
  } ]).toArray(function gotArray(error, results) {

    if (error) {
      callback(error);
    } else if (!results.length) {
      callback();
    } else {

      var ids = results[0].ids;

      // style exception, too simple
      chunks.removeMany({
        'files_id' : {
          $in : ids
        }
      }, function removedChunks(error) {

        if (error) {
          callback(error);
        } else {

          files.removeMany({
            _id : {
              $in : ids
            }
          }, callback);

        }

      });
      // style exception, too simple

    }
  });
};

// start of writing data
exports.compressData = function(data, dest, mime, meta, callback) {

  zlib.gzip(data, function gotCompressedData(error, data) {
    if (error) {
      callback(error);
    } else {

      meta.referenceFile = meta.referenceFile || dest;

      exports.writeData(data, dest + '.gz', mime, meta, callback, true);
    }

  });

};

exports.writeData = function(data, dest, mime, meta, callback, compressed) {

  if (typeof (data) === 'string') {

    data = Buffer.from(data, 'utf-8');
  }

  if (!compressed) {

    meta.lastModified = new Date();

    if (miscOps.isPlainText(mime)) {
      meta.compressed = true;
    }
  }

  if (verbose) {
    console.log('Writing data on gridfs under \'' + dest + '\'');
  }

  var uploadStream = bucket.openUploadStream(dest, {
    contentType : mime,
    metadata : meta
  });

  uploadStream.once('error', callback);

  uploadStream.once('finish', function finished() {

    // style exception, too simple
    exports.removeDuplicates(uploadStream, function removedDuplicates(error) {

      if (error) {
        callback(error);
      } else {

        if (!compressed && meta.compressed) {
          exports.compressData(data, dest, mime, meta, callback);
        } else {
          callback();
        }

      }

    });
    // style exception, too simple

  });

  uploadStream.write(data);

  uploadStream.end();

};
// end of writing data

exports.writeFile = function(path, dest, mime, meta, callback) {

  meta.lastModified = new Date();

  if (verbose) {
    var message = 'Writing ' + mime + ' file on gridfs under \'';
    message += dest + '\'';
    console.log(message);
  }

  var readStream = fs.createReadStream(path);

  var uploadStream = bucket.openUploadStream(dest, {
    contentType : mime,
    metadata : meta
  });

  readStream.on('error', callback);
  uploadStream.on('error', callback);

  uploadStream.once('finish', function uploaded() {
    exports.removeDuplicates(uploadStream, callback);
  });

  readStream.pipe(uploadStream);

};

exports.removeFiles = function(name, callback) {

  if (typeof (name) === 'string') {
    name = [ name ];
  }

  files.aggregate([ {
    $match : {
      filename : {
        $in : name
      }
    }
  }, {
    $group : {
      _id : 0,
      ids : {
        $push : '$_id'
      }
    }
  } ], function gotFiles(error, results) {

    if (error) {
      if (callback) {
        callback();
      }
    } else if (!results.length) {
      callback();
    } else {

      var ids = results[0].ids;

      // style exception, too simple
      chunks.removeMany({
        'files_id' : {
          $in : ids
        }
      }, function removedChunks(error) {

        if (error) {
          callback(error);
        } else {

          files.removeMany({
            _id : {
              $in : ids
            }
          }, callback);

        }

      });
      // style exception, too simple
    }

  });

};

// start of outputting file
exports.setExpiration = function(header, stats) {
  var expiration = new Date();

  if (permanentTypes.indexOf(stats.metadata.type) > -1) {
    expiration.setFullYear(expiration.getFullYear() + 1);
  }

  header.push([ 'expires', expiration.toUTCString() ]);
};

exports.setCookies = function(header, cookies) {
  if (cookies) {

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];

      var toPush = [ 'Set-Cookie', cookie.field + '=' + cookie.value ];

      if (cookie.expiration) {
        toPush[1] += '; expires=' + cookie.expiration.toUTCString();
      }

      if (cookie.path) {
        toPush[1] += '; path=' + cookie.path;
      }

      header.push(toPush);

    }
  }
};

exports.readRangeHeader = function(range, totalLength) {

  if (!range || range.length === 0) {
    return null;
  }

  var array = range.split(/bytes=([0-9]*)-([0-9]*)/);
  var start = parseInt(array[1]);
  var end = parseInt(array[2]);

  if (isNaN(start)) {
    start = totalLength - end;
    end = totalLength - 1;
  } else if (isNaN(end)) {
    end = totalLength - 1;
  }

  // limit last-byte-pos to current length
  if (end > totalLength - 1) {
    end = totalLength - 1;
  }

  // invalid or unsatisifiable
  if (isNaN(start) || isNaN(end) || start > end || start < 0) {
    return null;
  }

  return {
    start : start,
    end : end
  };

};

exports.getHeader = function(stats, req, cookies) {
  var header = miscOps.corsHeader(stats.contentType);
  var lastM = stats.metadata.lastModified || stats.uploadDate;
  header.push([ 'last-modified', lastM.toUTCString() ]);

  exports.setExpiration(header, stats);

  exports.setCookies(header, cookies);

  return header;
};

// Side effects: push data to the header and adds fields to options
exports.isRangeValid = function(range, options, stats, header, res) {

  // If the range can't be fulfilled.
  if (range.start >= stats.length || range.end >= stats.length) {

    if (verbose) {
      console.log('416');
    }

    header.push([ 'Content-Range', 'bytes */' + stats.length ]);
    res.writeHead(416, header);

    res.end();
    return false;
  }

  header.push([ 'Content-Range',
      'bytes ' + range.start + '-' + range.end + '/' + stats.length ]);

  options.start = range.start;
  options.end = range.end;

  return true;

};

exports.streamFile = function(stream, range, stats, req, res, header, cookies,
    retries, callback) {

  var wrote = false;

  stream.on('data', function(chunk) {

    if (!wrote) {
      wrote = true;

      if (stats.metadata.compressed) {

        if (req.compressed) {
          header.push([ 'Content-Encoding', 'gzip' ]);
        }

        header.push([ 'Vary', 'Accept-Encoding' ]);
      }

      if (alternativeLanguages) {
        header.push([ 'Vary', 'Accept-Language' ]);
      }

      if (stats.metadata.languages) {

        header
            .push([ 'Content-Language', stats.metadata.languages.join(', ') ]);
      }

      res.writeHead(range ? 206 : (stats.metadata.status || 200), header);
    }

    res.write(chunk);

  });

  stream.once('end', function() {
    res.end();
    callback();
  });

  stream.once('error', function(error) {

    retries = retries || 0;

    if (wrote || retries >= 9) {
      callback(error);
    } else {

      // We failed before writing anything, wait 10ms and try again
      setTimeout(function() {
        exports.prepareStream(stats, req, callback, cookies, res, ++retries);
      }, 10);

    }

  });

};

exports.prepareStream = function(stats, req, callback, cookies, res, retries) {

  var header = exports.getHeader(stats, req, cookies);

  var range = exports.readRangeHeader(req.headers.range, stats.length);
  header.push([ 'Accept-Ranges', 'bytes' ]);

  var options = {
    revision : 0
  };

  var length;

  if (range) {

    if (!exports.isRangeValid(range, options, stats, header, res)) {
      callback();
      return;
    }

    length = range.end - range.start + 1;

  } else {
    length = stats.length;
  }

  header.push([ 'Content-Length', length ]);

  exports.streamFile(bucket.openDownloadStreamByName(stats.filename, options),
      range, stats, req, res, header, cookies, retries, callback);

};

exports.output304 = function(fileStats, res) {

  if (verbose) {
    console.log('304');
  }

  var header = [];

  if (alternativeLanguages) {
    header.push([ 'Vary', 'Accept-Language' ]);
  }

  exports.setExpiration(header, fileStats);

  if (fileStats.metadata.compressed) {
    header.push([ 'Vary', 'Accept-Encoding' ]);
  }

  res.writeHead(304, header);
  res.end();

};

exports.shouldOutput304 = function(req, stats) {

  stats.metadata = stats.metadata || {};

  var lastModified = stats.metadata.lastModified || stats.uploadDate;

  var lastSeen = req.headers ? req.headers['if-modified-since'] : null;

  var mTimeMatches = lastSeen === lastModified.toUTCString();

  return mTimeMatches && !disable304 && !stats.metadata.status;

};

exports.takeLanguageFile = function(file, req, currentPick) {

  var isCompressed = file.filename.indexOf('.gz') === file.filename.length - 3;

  var toRet = (req.compressed ? true : false) === isCompressed;

  return toRet || (!currentPick && !isCompressed);

};

exports.handlePickedFile = function(finalPick, req, cookies, res, callback) {

  if (!finalPick) {
    exports.outputFile('/404.html', req, res, callback, cookies, true);
  } else if (exports.shouldOutput304(req, finalPick)) {
    exports.output304(finalPick, res);
  } else {
    if (verbose) {
      console.log('Streaming \'' + finalPick.filename + '\'');
    }
    exports.prepareStream(finalPick, req, callback, cookies, res);
  }

};

exports.pickFile = function(fileRequested, req, res, cookies, possibleFiles,
    callback) {

  var vanilla;
  var compressed;
  var language;

  for (var i = 0; i < possibleFiles.length; i++) {

    var file = possibleFiles[i];

    if (fileRequested === file.filename) {
      vanilla = file;
    } else if (!file.metadata.languages && req.compressed) {
      compressed = file;
    } else if (exports.takeLanguageFile(file, req, language)) {
      language = file;
    }
  }

  exports.handlePickedFile(language || compressed || vanilla, req, cookies,
      res, callback);

};

// retry means it has already failed to get a page and now is trying to get the
// 404 page. It prevents infinite recursion
exports.outputFile = function(file, req, res, callback, cookies, retry) {

  if (verbose) {
    console.log('Outputting \'' + file + '\' from gridfs');
  }

  var languageCondition = req.language ? {
    $or : [ {
      'metadata.languages' : {
        $exists : false
      }
    }, {
      'metadata.languages' : {
        $in : req.language.headerValues
      }
    } ]
  } : {
    'metadata.languages' : {
      $exists : false
    }
  };

  files.find({
    $or : [ {
      $and : [ {
        'metadata.referenceFile' : file
      }, languageCondition ]
    }, {
      filename : file
    } ]
  }).toArray(function gotFiles(error, possibleFiles) {

    if (error) {
      callback(error);
    } else if (!possibleFiles.length) {

      if (retry) {
        callback({
          code : 'ENOENT'
        });
      } else {
        exports.outputFile('/404.html', req, res, callback, cookies, true);
      }

    } else {
      exports.pickFile(file, req, res, cookies, possibleFiles, callback);
    }
  });

};
// end of outputting file
