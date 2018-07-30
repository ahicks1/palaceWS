const WebSocket = require('ws');
const Ajv = require('ajv');
const fs = require('fs');
const log = require('./log');

/**
 * A message recieved from a client
 * @typedef {Object} InboundMessage
 * @property {string} target - Message target
 * @property {string[]} [tags] - List of IDs if target is TARGETED
 * @property {string} type - The message type, usually DATA
 * @property {string} payload - Stringified JSON data
 */

/** An association list between roomIDs and rooms
 * @type {Object<string,Room>}
 */
var rooms = {};

const wss = new WebSocket.Server({ port: 8080, verifyClient: checkConnection });
const TAG = "Main";

//Start validation constants
var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
var messageValidator = getValidator("outboundMessage.json");



/**
 * Creates a new connInfo object to hold metadata for a given ws connection
 * @constructor
 *
 */
function ConnInfo() {

  //TODO AJH handle reconnection by checking for secret
  /** @member {string} - The user-friendly name */
  this.name = undefined;
  /** @member {string} - An 8 digit hex string id */
  this.id = undefined;
  /** @member {string} - A 128 digit secret uuid for reconnection*/
  this.secret = undefined;
  /** @member {string} - The 4 letter room code*/
  this.room = undefined;


}

/*
 * Called whenever a new connection is recieved
 */
wss.on('connection', function connection(ws) {
  log.info(TAG,'New Connection, waiting for init message');
  let meta = new ConnInfo();
  /** Event listener handling incoming messages*/
  ws.on('message', function incoming(raw) {
    log.info(TAG,'received: '+ raw);
    //Try parsing and validating message
    let message = {};
    try {
      message = JSON.parse(raw);
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
    if(message.target === "SERVER")
      handleServerMessage(ws, meta, message);
    else
      handleOutboundMessage(ws, meta, message);


  });



  ws.send('something');
});

/**
 * Handles messages with the SERVER target
 * @param {WebSocket} ws  - Handle to the connection
 * @param {ConnInfo} meta - The meta information for the connection
 * @param {InboundMessage} msg - The parsed message object
 */
function handleServerMessage(ws, meta, msg) {
  log.info(TAG,'internal server message!');
}

/**
 * Handles messages intended to be retransmitted target
 * @param {WebSocket} ws  - Handle to the connection
 * @param {ConnInfo} meta - The meta information for the connection
 * @param {InboundMessage} msg - The parsed message object
 */
function handleOutboundMessage(ws, meta, msg) {
  log.info(TAG, msg.target+' message!');
  if(!checkValidConnection(meta)) {
    log.error("MSG","client is not onboarded")
    return;
  }
}

function checkConnection(info) {
  let {origin,req} = info;
  return true;
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
