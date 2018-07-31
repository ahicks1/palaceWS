var colors = require('colors');
/** @module */
/**
 * A function for logging errors in red
 * @param {string} tag - The log tag for easier searching
 * @param {string} msg - The message to be logged
 */
exports.error = (tag,msg) => {
  console.log('['+tag.bold+'] '+msg.red);
}

/**
 * A function for logging warnings in orange
 * @param {string} tag - The log tag for easier searching
 * @param {string} msg - The message to be logged
 */
exports.warn = (tag,msg) => {
  console.log('['+tag.bold+'] '+msg.orange);
}

/**
 * A function for logging messages in green
 * @param {string} tag - The log tag for easier searching
 * @param {string} msg - The message to be logged
 */
exports.info = (tag,msg) => {
  console.log('['+tag.bold+'] '+msg.green);
}
