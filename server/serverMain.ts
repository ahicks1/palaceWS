import * as WS from "ws";
import * as SC from "../protocolCore/socketCore"
import * as http from 'http';


/** A typescript intersection type */
type palaceConn = WS & connMeta;

/** An association list between name and palaceRoom */
let roomList:any = {};

//Start the server
const server = new WS.Server({ port: 8080 });
console.log("started");
server.on('connection', handleNewConnection);



/** Called whenever a new connection is recieved */
function handleNewConnection(ws:WS,req:http.IncomingMessage) {
  console.log('New Connection, waiting for init message');

  /** Intersection type adding palace data to ws connection */
  let connection = addMetaWS(ws,new connMeta);

  /** Event listener handling incoming messages*/
  ws.on('message', function incoming(raw) {
    //TODO: AJH ensure that 'raw' can be parsed
    let msg: SC.serverMessage = JSON.parse(raw.toString());
    console.log(raw.toString());

    // Handle init message
    if(connection.room == undefined && msg.target == SC.messageTarget.SERVER) {

      console.log("Init message:" + msg.payload);
      //TODO: AJH ensure that 'msg.payload' can be parsed
      let init = JSON.parse(msg.payload);

      // Check if controller or client
      if(init.type == SC.connectionType.CONTROLLER) {

        // Ensure room doesn't exist already
        if(init.room != undefined && init.name != undefined ) {
          connection.room = init.room;
          connection.publicName = init.name;

          // Store the new room in the list of rooms
          roomList[init.room] = new palaceRoom(init.room,connection);
          console.log("created new room with name: "+init.room);

        } else {
          // Drop connection because room already exists
          connection.close(1000,"Room already exists");
        }

      } else if(init.type == SC.connectionType.CLIENT) {
        // Only connect if
        if(roomList[init.room] != undefined) {
          connection.room = init.room;
          connection.publicName = init.name;
          roomList[init.room].clients[init.name] = connection;
          console.log("client "+init.name+" joined "+init.room);
        } else {
          console.log("room doesn't exist");
        }

      }
    //Handle standard serverMessage
    } else if(connection.room != undefined && msg.target != SC.messageTarget.SERVER){
      if(msg.target == SC.messageTarget.CONTROLLER) {

      } else if(msg.target == SC.messageTarget.ALL) {

      } else if(msg.target == SC.messageTarget.TARGETED) {

      } else {
        //Message is meant for server; Ignoring for now
      }
    //Handle unkown message by terminating connection
    } else {
      connection.close(1000,"Unexpected message sent before init");
    }

  });

  /* Event listener handling closed connection events */
  ws.on('close', function closed(code,reason) {
    //Ensure connection both contained a room and the room exists
    if(connection.room != undefined && roomList[connection.room] != undefined) {
      if(roomList[connection.room].controller.publicName == connection.publicName) {
        //Connection closed was the controller; delete all clients
        console.log("controller connection closed, deleting room");
        for (let c in roomList[connection.room].clients) {
          console.log(c);
          roomList[connection.room].clients[c].close(1000,"controller disconnected");
          delete roomList[connection.room].clients[c];
        }
        //All clients are deleted; delete room
        delete roomList[connection.room];

      } else {
        console.log("client connection closed");
        delete roomList[connection.room].clients[connection.publicName];
      }
    }
  });


}

/**
 * Adds palace metadata to a basic WS connection
 * @param ws - The WS connection to attach the metadata to
 * @param meta - The metadata to attach
 */
function addMetaWS(ws:WS,meta:connMeta): palaceConn {
  (<any>ws).room = meta.room;
  (<any>ws).publicName = meta.publicName;
  return <palaceConn>ws;
}

/** Holds metadata */
class connMeta {
  room:string;
  publicName:string;
}

/** Stores all information about a room */
class palaceRoom {
  /** The room name */
  name:string;
  /** The controller for the room */
  controller:palaceConn;
  /** An association list between name and palaceConn */
  clients:any;

  /**
   * Creates a new room
   * @param name - The name of the room
   * @param controller - The controller creating the room
   */
  constructor(name:string,controller:palaceConn) {
    this.name = name;
    this.controller = controller;
    this.clients = {};
  }
}
