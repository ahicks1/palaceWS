const WebSocket = require('ws');
const Ajv = require('ajv');
const fs = require('fs');
const log = require('./log');

/** An association list between roomIDs and rooms
 * @type {Object<string,Room>}
 */
var rooms = {};

const wss = new WebSocket.Server({ port: 8080 });
const TAG = "Main";

//Start validation constants
var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
var messageValidator = getValidator("outboundMessage.json");

const targetHandles = {
  SERVER:handleServerMessage,
  CONTROLLER:handleOutboundMessage,
  TARGETED:handleOutboundMessage,
  ALL:handleOutboundMessage,
  CLIENTS:handleOutboundMessage
}

/**
 * Creates a new connInfo object to hold metadata for a given ws connection
 * @constructor
 *
 * @param {string=} secret - a 128 digit secret uuid for reconnection
 */
function ConnInfo(secret) {

  //TODO AJH handle reconnection by checking for secret
  /** @member {string} - The user-friendly name */
  this.name = undefined;
  /** @member {string} - An 8 digit hex string id */
  this.id = undefined;
  /** @member {string} - A 128 digit secret uuid for reconnection*/
  this.secret = secret;
  /** @member {string} - The 4 letter room code*/
  this.room = undefined;


}

/*
 * Called whenever a new connection is recieved
 */
wss.on('connection', function connection(ws) {
  log.info(TAG,'New Connection, waiting for init message');

  /** Event listener handling incoming messages*/
  ws.on('message', function incoming(raw) {
    log.info(TAG,'received: '+ raw);
    //Try parsing and validating message
    try {
      let message = JSON.parse(raw);
      var valid = messageValidator(message);
      if (!valid) {

        log.error(TAG,JSON.stringify(messageValidator.errors));
        throw "Invalid message"
      }
    } catch (e) {
      log.error(TAG,"Invalid JSON")
      ws.send('[ERROR] invalid message');
      ws.close();
      return;
    }
    //ws.send('[SUCCESS] valid message');
    log.info(TAG,'Valid message!');


  });

  ws.send('something');
});

/**
 * Handles messages with the SERVER target
 * @param {WebSocket} ws  - Handle to the connection
 * @param {ConnInfo} meta - The meta information for the connection
 * @param {Object} msg - The parsed message object
 * @param {string} msg.target - This will be SERVER
 * @param {string} msg.type - The type of the message
 * @param {string} msg.payload - The stringified payload (structure depends on type)
 */
function handleServerMessage(ws, meta, msg) {

}

/**
 * Handles messages intended to be retransmitted target
 * @param {WebSocket} ws  - Handle to the connection
 * @param {ConnInfo} meta - The meta information for the connection
 * @param {Object} msg - The parsed message object
 * @param {string} msg.target - This the target
 * @param {string[]} [msg.tags] - the 8 digit target IDs
 * @param {string} msg.type - The type of the message
 * @param {string} msg.payload - The stringified payload (structure depends on type)
 */
function handleOutboundMessage(ws, meta, msg) {

}



/**
 * Get the json validator for a given json schema file
 * @param {string} filename - the path of the file within ./messageSchema
 */
function getValidator(filename) {
  let text = fs.readFileSync('./messageSchema/'+filename);
  let obj = JSON.parse(text);
  let validator = ajv.compile(obj);
  return validator;
}
