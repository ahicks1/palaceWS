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

 /** A class holding all the options for a room
  * @constructor
  */
 function RoomOptions() {
    this.broadcastConnections = false;
    this.allowReconnecting = true;
    this.privateRoom = false;
    this.roomSize = 100;
    this.allowClientToClient = true;
 }

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
  /** @member {RoomOptions} */
  this.options = new RoomOptions();

}

/**
 * @param {ConnInfo} conn - the connection info to add to the room
 */
Room.prototype.addClient = function(conn) {
  this.clients[conn.id] = conn;
  let payload = {'name':conn.name,'id':conn.id};
  let message = getOutboundMessage('SERVER','CLIENT_ADDED',JSON.stringify(payload));
  let targets = [conn.id];
  if(this.options.broadcastConnections) targets = Object.keys(this.clients);
  targets.push(this.controller.id);
  this.broadcastMessage(targets,message);
  //TODO: AJH - Broadcast client add event to all interested parties
}

/**
 * @param {ConnInfo} conn - the connection info to add to the room
 */
Room.prototype.removeClient = function(conn) {
  delete this.clients[conn.id];
  //TODO: AJH - Broadcast client remove event to all interested parties
}

/**
 * @param {string[]} targets
 * @param {string} message
 */
Room.prototype.broadcastMessage = function(targets,message) {
  targets.forEach(t => {
    if(this.clients[t])
      this.clients[t].conn.send(message);
    else if(this.controller.id === t) 
      this.controller.conn.send(message);
    else
      log.warn(TAG, `ID: ${t} not found`);
  })
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

/**
 * Adds the client the room or sets up a new room
 * @param {WebSocket} ws 
 * @param {IncomingMessage} req 
 * 
 * @returns {ConnInfo} - The information about the connection
 */
function handleSetup(ws,req) {
  log.info(TAG,'New Connection!');

  //Parse params (We already know it's valid)
  let qstr = req.url.split('?');
  let params = parseQuery(qstr[1]);
  let isController = qstr[0].startsWith("/start");

  if(isController) {
    let meta = new ConnInfo(ws, qstr.name);
    rooms[meta.room] = new Room(`Room${Object.keys(rooms).length}`,meta,{});
    log.info(TAG, `Created new room: ${meta.room}`)
    return meta;

  } else {
    console.log(params.room);
    let meta = new ConnInfo(ws, params.name, params.room);
    let {id,secret} = params;
    if(id && secret) {
      if(rooms[meta.room] && 
         rooms[meta.room].clients[id] &&
         rooms[meta.room].clients[id].secret === secret) {
            meta.id = id;
            meta.secret = secret;
         } else {
           log.error(TAG, "Tried reconnect with invalid parameters");
           abortConnection();
         }
    } else {
      console.log(meta.room);
      //TODO: AJH - Add more checks, this is kinda brittle
      rooms[meta.room].addClient(meta);
    }
    return meta;
  }
  
}

/*
 * Called whenever a new connection is recieved
 */
wss.on('connection', function connection(ws,req) {
  meta = handleSetup(ws,req);
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
      log.error(TAG,`Invalid JSON: ${e}`);
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
  let targets = getTargets(meta,msg);
  let message = getOutboundMessage('CLIENT','DATA',msg.payload);
  rooms[meta.room].broadcastMessage(targets, message);

  //TODO: Make sure you're allowed to send the message you're trying to send
  
  log.info(TAG, msg.target+' message!');
}



/*==========================================================================
 *
 * Support functions
 *
 *=========================================================================*/


 /**
 * 
 * @param {ConnInfo} meta 
 * @param {InboundMessage} msg 
 * 
 * @returns {string[]}
 */
function getTargets(meta, msg) {
  let lst = [];
  switch(msg.target) {
    case 'CONTROLLER':
      return [rooms[meta.room].controller.id];
    case 'TARGETED':
      lst = msg.tags;
      if(!lst) throw ('No targets specified');
      lst = lst.filter((id) => rooms[meta.room].clients[id] || rooms[meta.room].controller.id === id)
      return lst;
    case 'ALL':
      lst = Object.keys(rooms[meta.room].clients);
      lst.push(rooms[meta.room].controller.id);
      return lst;
    case 'CLIENTS':
      lst = Object.keys(rooms[meta.room].clients);
      return lst;
    default:
      throw new Error("Invalid target");
  }
}

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
  let isController = qstr[0].startsWith("/start");
  let roomExists = params.room != undefined && rooms[params.room] != undefined;
  let isUrl = isController || (qstr[0].startsWith("/join") && roomExists);
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

/**
 * 
 * @param {WebSocket} ws 
 */
function abortConnection(ws) {
  ws.send('[ERROR] invalid message');
  ws.close();
}
