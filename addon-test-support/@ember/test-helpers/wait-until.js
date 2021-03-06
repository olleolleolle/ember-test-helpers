import { Promise } from 'rsvp';
import { futureTick } from './-utils';

const TIMEOUTS = [0, 1, 2, 5, 7];
const MAX_TIMEOUT = 10;

/**
  Wait for the provided callback to return a truthy value.

  This does not leverage `settled()`, and as such can be used to manage async
  while _not_ settled (e.g. "loading" or "pending" states).

  @public
  @param {Function} callback the callback to use for testing when waiting should stop
  @param {Object} [options] options used to override defaults
  @param {number} [options.timeout=1000] the maximum amount of time to wait
  @returns {Promise} resolves with the callback value when it returns a truthy value
*/
export default function waitUntil(callback, options = {}) {
  let timeout = 'timeout' in options ? options.timeout : 1000;

  // creating this error eagerly so it has the proper invocation stack
  let waitUntilTimedOut = new Error('waitUntil timed out');

  return new Promise(function(resolve, reject) {
    let time = 0;

    // eslint-disable-next-line require-jsdoc
    function scheduleCheck(timeoutsIndex) {
      let interval = TIMEOUTS[timeoutsIndex];
      if (interval === undefined) {
        interval = MAX_TIMEOUT;
      }

      futureTick(function() {
        time += interval;

        let value;
        try {
          value = callback();
        } catch (error) {
          reject(error);
        }

        if (value) {
          resolve(value);
        } else if (time < timeout) {
          scheduleCheck(timeoutsIndex + 1);
        } else {
          reject(waitUntilTimedOut);
        }
      }, interval);
    }

    scheduleCheck(0);
  });
}
