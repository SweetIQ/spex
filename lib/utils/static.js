'use strict';

var stream = require('stream');
var util = require('util');

/////////////////////////////////////
// Checks if the value is a promise;
function isPromise(value) {
    return value && typeof value.then === 'function';
}

////////////////////////////////////////////
// Checks object for being a readable stream;

function isReadableStream(obj) {
    return obj instanceof stream.Stream &&
        typeof obj._read === 'function' &&
        typeof obj._readableState === 'object';
}

////////////////////////////////////////////////////////////
// Sets an object property as read-only and non-enumerable.
function extend(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        configurable: false,
        enumerable: false,
        writable: false
    });
}

///////////////////////////////////////////
// Returns a space gap for console output;
function messageGap(level) {
    return Array(1 + level * 4).join(' ');
}

function formatError(error, level) {
    var names = ['BatchError', 'PageError', 'SequenceError'];
    var msg = util.inspect(error);
    if (error instanceof Error) {
        if (names.indexOf(error.name) === -1) {
            var gap = messageGap(level);
            msg = msg.split('\n').map(function (line, index) {
                return (index ? gap : '') + line;
            }).join('\n');
        } else {
            msg = error.toString(level);
        }
    }
    return msg;
}

module.exports = {
    formatError: formatError,
    isPromise: isPromise,
    isReadableStream: isReadableStream,
    messageGap: messageGap,
    extend: extend
};
