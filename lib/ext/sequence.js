'use strict';

var SequenceError = require('../errors/sequence');

/**
 * @method sequence
 * @description
 * **Alternative Syntax:**
 * `sequence(source, {dest, limit, track})` &#8658; `Promise`
 *
 * Resolves a dynamic sequence of [mixed values]{@tutorial mixed}.
 *
 * The method acquires [mixed values]{@tutorial mixed} from the `source` function, one at a time, and resolves them,
 * till either no more values left in the sequence or an error/reject occurs.
 *
 * It supports both [linked and detached sequencing]{@tutorial sequencing}.
 *
 * @param {Function|generator} source
 * Expected to return the next [mixed value]{@tutorial mixed} to be resolved. Returning or resolving
 * with `undefined` ends the sequence, and the method resolves.
 *
 * Parameters:
 *  - `index` = current request index in the sequence
 *  - `data` = resolved data from the previous call (`undefined` when `index=0`)
 *  - `delay` = number of milliseconds since the last call (`undefined` when `index=0`)
 *
 * The function inherits `this` context from the calling method.
 *
 * If the function throws an error or returns a rejected promise, the sequence terminates,
 * and the method rejects with {@link errors.SequenceError SequenceError}, which will have property `source` set.
 *
 * Passing in anything other than a function will reject with {@link external:TypeError TypeError} = `Parameter 'source' must be a function.`
 *
 * @param {Function|generator} [dest]
 * Optional destination function (or generator), to receive resolved data for each index,
 * process it and respond as required.
 *
 * Parameters:
 *  - `index` = index of the resolved data in the sequence
 *  - `data` = the data resolved
 *  - `delay` = number of milliseconds since the last call (`undefined` when `index=0`)
 *
 * The function inherits `this` context from the calling method.
 *
 * It can optionally return a promise object, if data processing is done asynchronously.
 * If a promise is returned, the method will not request another value from the `source` function,
 * until the promise has been resolved (the resolved value is ignored).
 *
 * If the function throws an error or returns a rejected promise, the sequence terminates,
 * and the method rejects with {@link errors.SequenceError SequenceError}, which will have property `dest` set.
 *
 * @param {Number} [limit=0]
 * Limits the maximum size of the sequence. If the value is greater than 0, the method will
 * successfully resolve once the specified limit has been reached.
 *
 * When `limit` isn't specified (default), the sequence is unlimited, and it will continue
 * till one of the following occurs:
 *  - `source` either returns or resolves with `undefined`
 *  - either `source` or `dest` functions throw an error or return a rejected promise
 *
 * @param {Boolean} [track=false]
 * Changes the type of data to be resolved by this method. By default, it is `false`
 * (see the return result). When set to be `true`, the method tracks/collects all resolved data
 * into an array internally, and resolves with that array once the method has finished successfully.
 *
 * It must be used with caution, as to the size of the sequence, because accumulating data for
 * a very large sequence can result in consuming too much memory.
 *
 * @returns {external:Promise}
 *
 * When successful, the resolved data depends on parameter `track`. When `track` is `false`
 * (default), the method resolves with object `{total, duration}`:
 *  - `total` = number of values resolved by the sequence
 *  - `duration` = number of milliseconds consumed by the method
 *
 * When `track` is `true`, the method resolves with an array of all the data that has been resolved,
 * the same way that the standard $[promise.all] resolves. In addition, the array comes extended with
 * a hidden read-only property `duration` - number of milliseconds consumed by the method.
 *
 * When the method fails, it rejects with {@link errors.SequenceError SequenceError}.
 */
function sequence(source, dest, limit, track, config) {

    var $p = config.promise, $utils = config.utils;

    if (typeof source !== 'function') {
        return $p.reject(new TypeError("Parameter 'source' must be a function."));
    }

    limit = (limit > 0) ? parseInt(limit) : 0;
    source = $utils.wrap(source);
    dest = $utils.wrap(dest);

    var self = this, data, srcTime, destTime, result = [], start = Date.now();

    return $p(function (resolve, reject) {

        function loop(idx) {
            var srcNow = Date.now(),
                srcDelay = idx ? (srcNow - srcTime) : undefined;
            srcTime = srcNow;
            $utils.resolve.call(self, source, [idx, data, srcDelay], function (value, delayed) {
                data = value;
                if (data === undefined) {
                    success();
                } else {
                    if (track) {
                        result.push(data);
                    }
                    if (dest) {
                        var destResult, destNow = Date.now(),
                            destDelay = idx ? (destNow - destTime) : undefined;
                        destTime = destNow;
                        try {
                            destResult = dest.call(self, idx, data, destDelay);
                        } catch (e) {
                            fail({
                                error: e,
                                dest: data
                            }, 3, dest.name);
                            return;
                        }
                        if ($utils.isPromise(destResult)) {
                            destResult
                                .then(function () {
                                    next(true);
                                    return null; // this dummy return is just to prevent Bluebird warnings;
                                })
                                .catch(function (error) {
                                    fail({
                                        error: error,
                                        dest: data
                                    }, 2, dest.name);
                                });
                        } else {
                            next(delayed);
                        }
                    } else {
                        next(delayed);
                    }
                }
            }, function (reason, isRej) {
                fail({
                    error: reason,
                    source: data
                }, isRej ? 0 : 1, source.name);
            });

            function next(delayed) {
                if (limit === ++idx) {
                    success();
                } else {
                    if (delayed) {
                        loop(idx);
                    } else {
                        $p.resolve()
                            .then(function () {
                                loop(idx);
                                return null; // this dummy return is just to prevent Bluebird warnings;
                            });
                    }
                }
            }

            function success() {
                var length = Date.now() - start;
                if (track) {
                    $utils.extend(result, 'duration', length);
                } else {
                    result = {
                        total: idx,
                        duration: length
                    }
                }
                resolve(result);
            }

            function fail(reason, code, cbName) {
                reason.index = idx;
                reject(new SequenceError(reason, code, cbName, Date.now() - start));
            }
        }

        loop(0);
    });
}

module.exports = function (config) {
    return function (source, dest, limit, track) {
        if (dest && typeof dest === 'object') {
            return sequence.call(this, source, dest.dest, dest.limit, dest.track, config);
        } else {
            return sequence.call(this, source, dest, limit, track, config);
        }
    };
};
