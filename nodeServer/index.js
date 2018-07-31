const WebSocket = require('ws');
const Ajv = require('ajv');
const fs = require('fs');
const log = require('./log');
const crypto = require("crypto");

/*==========================================================================
 *
 * Classes and types
 *
 *=========================================================================*/
/**
 * A message recieved from a client
 * @typedef {Object} InboundMessage
 * @property {string} target - Message target
 * @property {string[]} [tags] - List of IDs if target is TARGETED
 * @property {string} type - The message type, usually DATA
 * @property {string} payload - Stringified JSON data
 */

/**
 * A class holding a room's information
 * @constructor
 *
 * @param {string} name - The friendly name of the room
 * @param {ConnInfo} controller - The creating connection or the "controller"
 * @param {Object<string,ConnInfo>} clients - An association list between Id's and connections
 */
function Room(name,controller,clients) {
  /** @member {string} - The friendly name of the room */
  this.name = name;
  /** @member {ConnInfo} - The central "room admin" */
  this.controller = controller;
  /** @member {Object<string,ConnInfo>} - An association list between Id's and connections */
  this.clients = clients;

}

/**
 * Creates a new connInfo object to hold metadata for a given ws connection
 * @constructor
 *
 */
function ConnInfo(conn,name,room,id,secret) {

  //TODO AJH handle reconnection by checking for secret
  /** @member {WebSocket} - the WebSocket connection */
  this.conn = conn;
  /** @member {string} - The user-friendly name */
  this.name = name;
  /** @member {string} - An 8 digit hex string id */
  this.id = id || crypto.randomBytes(4).toString('hex');
  /** @member {string} - A 64 digit secret uuid for reconnection*/
  this.secret = secret || crypto.randomBytes(32).toString('base64');
  /** @member {string} - The 4 letter room code*/
  this.room = room || crypto.randomBytes(2).toString('hex');


}

/*==========================================================================
 *
 * Globals
 *
 *=========================================================================*/
/** An association list between roomIDs and rooms
 * @type {Object<string,Room>}
 */
var rooms = {};

const wss = new WebSocket.Server({ port: 8080, verifyClient: checkConnection });
const TAG = "MAIN";

//Start validation constants
var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
var messageValidator = getValidator("inboundMessage.json");

// This is for long term extensibility, overkill right now
var serverMessageTypeTree = {
  "GET_CLIENTS":() => {},
  "CONFIGURE":() => {}
};

// This is for long term extensibility, overkill right now
var outboundMessageTypeTree = {
  "DATA":() => {}
};

/*==========================================================================
 *
 * Main server handlers
 *
 *=========================================================================*/

/*
 * Called whenever a new connection is recieved
 */
wss.on('connection', function connection(ws,req) {
  log.info(TAG,'New Connection, waiting for init message');
  let qstr = req.url.split('?');;
  let params = parseQuery(qstr[1]);
  let isController = qstr[0].startsWith("/controller/");
  let roomID = qstr.room;
  let meta = new ConnInfo(ws,qstr.name, roomID);
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
}



/*==========================================================================
 *
 * Support functions
 *
 *=========================================================================*/

/**
 * Checks if connection request is valid
 * @param {Object} info - The connection info object provided by the Websocket server
 *
 * @returns {boolean} - Whether the server should continue the connection process
 */
function checkConnection(info) {
  let qstr = info.req.url.split('?');
  if(!qstr[1]) return false;
  let params = parseQuery(qstr[1]);
  let isQuery = params.name != undefined;
  if(!isQuery) log.error("CONN","no name in queryString");
  let isController = qstr[0].startsWith("/controller");
  let roomExists = params.room != undefined && rooms[params.room] != undefined;
  let isUrl = isController || (qstr[0].startsWith("/client") && roomExists);
  if(!isUrl) log.error("CONN","wrong endpoint");
  return isQuery && isUrl;
}

/**
 * Parses the provided queryString and returns a map of Keys->Values
 * @param {string} queryString - The query to be parsed
 *
 * @returns {Object<string,string>} - A map between keys and values
 */
function parseQuery(queryString) {
    var query = {};
    var pairs = queryString.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

/**
 * A gets a message for transmitting to a client
 * @param {string} source - The source of the message
 * @param {string} type - The type of the message
 * @param {string} payload - The stringified payload
 *
 * @returns {string} - the outbound message stringified
 */
 function getOutboundMessage(source,type,payload) {
   return JSON.stringify({
     source:source,
     type:type,
     payload:payload
   });
 }

/**
 * Get the json validator for a given json schema file
 * @param {string} filename - the path of the file within ./messageSchema
 *
 * @returns {ajv.ValidateFunction} - Validator from the ajv library
 */
function getValidator(filename) {
  let text = fs.readFileSync('./messageSchema/'+filename);
  let obj = JSON.parse(text);
  let validator = ajv.compile(obj);
  return validator;
}
