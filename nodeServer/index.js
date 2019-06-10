const {Room, ConnInfo, getOutboundMessage} =  require('./room');

const WebSocket = require('ws');
const Ajv = require('ajv');
const fs = require('fs');
const log = require('./log');


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
var messageValidator = getValidator("inboundMessage.schema.json");
var configurationValidator = getValidator("roomConfiguration.schema.json");

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
    rooms[meta.room] = new Room(`Room${Object.keys(rooms).length}`,meta.room, meta,{});
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
  let meta = handleSetup(ws,req);
  /** Event listener handling incoming messages*/
  ws.on('message', (raw) => {
    log.info(TAG,'received: '+ raw);
    //Try parsing and validating message
    let message = {};
    try {
      message = JSON.parse(raw);
      let valid = messageValidator(message);
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

  ws.on( 'close', (ws,code,reason) => {
    if(rooms[meta.room].controller.id === meta.id) {
      //Destroy room
    } else {
      //Delete connection
      rooms[meta.room].removeClient(meta);
    }
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
  let out = "";
  let targets = [];
  switch(msg.type) {
    case 'GET_ROOM':
    //TODO: AJH - should I make sure the client has permission to ask for this? 
    // Nah, screw security
      out = rooms[meta.room].getRoomPayload(meta, msg);
      targets = [meta.id];
      rooms[meta.room].broadcastMessage(targets,out);
      break;
    case 'CONFIGURE':
      try {
        let config = JSON.parse(msg.payload);
        let valid = configurationValidator(config);
        if(!valid) throw "Invalid JSON"
        Object.assign(rooms[meta.room].options,config);
      } catch (e) {
        log.error(TAG,e)
        return;
      }
      out = rooms[meta.room].getRoomPayload(meta, msg);
      targets = [meta.id];
      rooms[meta.room].broadcastMessage(targets,out);
      break;
  }
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
