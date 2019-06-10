const crypto = require("crypto");


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
exports.getOutboundMessage = getOutboundMessage;
 

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

 exports.RoomOptions = RoomOptions;

/**
 * A class holding a room's information
 * @constructor
 *
 * @param {string} name - The friendly name of the room
 * @param {string} id - The id name of the room
 * @param {ConnInfo} controller - The creating connection or the "controller"
 * @param {Object<string,ConnInfo>} clients - An association list between Id's and connections
 */
function Room(name,id,controller,clients) {
  /** @member {string} name - The friendly name of the room */
  this.name = name;
  /** @member {ConnInfo} controller - The central "room admin" */
  this.controller = controller;
  /** @member {Object<string,ConnInfo>} clients - An association list between Id's and connections */
  this.clients = clients;
  /** @member {string} id -  */
  this.id = id;
  /** @member {RoomOptions} options */
  this.options = new RoomOptions();

}


exports.Room = Room;

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

this.clients[conn.id] = conn;
  let payload = {'name':conn.name,'id':conn.id};
  let message = getOutboundMessage('SERVER','CLIENT_REMOVED',JSON.stringify(payload));
  let targets = [conn.id];
  if(this.options.broadcastConnections) targets = Object.keys(this.clients);
  targets.push(this.controller.id);
  this.broadcastMessage(targets,message);

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
 * @param {ConnInfo} meta
 * @param {InboundMessage} msg
 * 
 * @returns {string}
 */
Room.prototype.getRoomPayload = function(meta,msg) {

  let ret = {
    clients:Object.keys(this.clients).map(id => {return {id:id,name:this.clients[id].name}}),
    controller:{id:this.controller.id,name:this.controller.name},
    id:this.room,
    options:Object.assign({},this.options)
  };
  return JSON.stringify(ret);

}

Room.prototype.destroyRoom = function() {

}


/**
 * Creates a new connInfo object to hold metadata for a given ws connection
 * @constructor
 * 
 */
function ConnInfo(conn,name,room,id,secret) {

  //TODO AJH handle reconnection by checking for secret
  /** @member {WebSocket} conn - the WebSocket connection */
  this.conn = conn;
  /** @member {string} name - The user-friendly name */
  this.name = name;
  /** @member {string} id - An 8 digit hex string id */
  this.id = id || crypto.randomBytes(4).toString('hex');
  /** @member {string} secret - A 64 digit secret uuid for reconnection*/
  this.secret = secret || crypto.randomBytes(32).toString('base64');
  /** @member {string} room - The 4 letter room code*/
  this.room = room || crypto.randomBytes(2).toString('hex');


}

exports.ConnInfo = ConnInfo;