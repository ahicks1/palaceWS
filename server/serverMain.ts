import * as WS from "ws";
import * as SC from "../protocolCore/socketCore"
import * as http from 'http';


/** A typescript intersection type */
type PalaceConn = WS & ConnMeta;

/** An association list between id and PalaceRoom */
let roomList:any = {};


//Start the server
const server = new WS.Server({ port: 8080 });
console.log("started");
server.on('connection', handleNewConnection);



/** Called whenever a new connection is recieved */
function handleNewConnection(ws:WS,req:http.IncomingMessage) {
  console.log('New Connection, waiting for init message');

  /** Intersection type adding palace data to ws connection */
  let connection = addMetaWS(ws,new ConnMeta);

  /** Event listener handling incoming messages*/
  ws.on('message', function incoming(raw) {
    //TODO: AJH ensure that 'raw' can be parsed
    let msg: SC.ServerMessage = JSON.parse(raw.toString());
    console.log(raw.toString());

    // Handle init message
    if(connection.room == undefined && msg.target == SC.messageTarget.SERVER) {

      console.log("Init message:" + msg.payload);
      //TODO: AJH ensure that 'msg.payload' can be parsed
      let init = JSON.parse(msg.payload);

      // Check if controller or client
      if(init.type == SC.serverInTypes.START) {

        // Ensure room doesn't exist already
        if(init.room != undefined &&
           init.name != undefined &&
           roomList[init.room] == undefined
         ) {
          connection.room = init.room;
          connection.id = getValidID();
          connection.name = init.name;

          // Store the new room in the list of rooms
          roomList[init.room] = new PalaceRoom(init.room,connection);
          connection.send(formatConnectionPacket(connection.id,connection.name))
          console.log("created new room with name: "+init.room);

        } else {
          // Drop connection because room already exists
          connection.close(1000,"Room already exists");
        }

      } else if(init.type == SC.serverInTypes.JOIN) {
        // Only connect if room exists
        if(roomList[init.room] != undefined) {
          connection.room = init.room;
          connection.id = getValidID();
          connection.name = init.name;
          roomList[init.room].clients[connection.id] = connection;
          //sent id to connection
          connection.send(formatConnectionPacket(connection.id,connection.name));
          console.log("client "+init.name+" joined "+init.room);
          //Send client info about the room
          connection.send(formatClientsPacket(connection.room));

          let connPacket = formatNewClientPacket(connection)
          //Send controller info about the new client
          roomList[connection.room].controller.send(connPacket);

          //Send info about the new client to all other clients
          for (let conn in roomList[init.room].clients) {

            if(conn != connection.id) {
              roomList[connection.room].clients[conn].send(connPacket);
            }

          }

        } else {
          console.log("room doesn't exist");
          connection.close(1000,"Room not found");
        }

      }
    //Handle standard ServerMessage
    } else if(connection.room != undefined &&
              msg.target != SC.messageTarget.SERVER) {
      //Check if connection is controller
      let source = roomList[connection.room].controller.id == connection.id
                 ? SC.messageSource.CONTROLLER
                 : SC.messageSource.CLIENT

      //Determine endpoints
      if(msg.target == SC.messageTarget.CONTROLLER) {
        roomList[connection.room].controller.send(formatOutPacket(source,msg.payload));
      } else if(msg.target == SC.messageTarget.ALL) {
        for (let conn in roomList[connection.room].clients) {
        roomList[connection.room].clients[conn].send(formatOutPacket(source,msg.payload));
        }
        roomList[connection.room].controller.send(formatOutPacket(source,msg.payload));
      } else if(msg.target == SC.messageTarget.TARGETED) {
        for (let conn of msg.tags) {
          if(roomList[connection.room].clients[conn] != undefined) {
            roomList[connection.room].clients[conn].send(formatOutPacket(source,msg.payload));
          } else if(roomList[connection.room].controller.id == conn) {
            roomList[connection.room].controller.send(formatOutPacket(source,msg.payload));
          }

        }
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
      if(roomList[connection.room].controller.id == connection.id) {
        //Connection closed was the controller; delete all clients
        console.log("controller connection closed, deleting room");
        for (let c in roomList[connection.room].clients) {
          console.log(c);
          roomList[connection.room].clients[c].close(
            1000,
            "controller disconnected"
          );

          delete roomList[connection.room].clients[c];
        }
        //All clients are deleted; delete room
        delete roomList[connection.room];

      } else {
        console.log("client connection closed");
        delete roomList[connection.room].clients[connection.id];
      }
    }
  });


}

/**
 * Gets the string representation of a ClientMessage
 * @param source - Where the message originated from
 * @param payload - The stringified data being sent
 */
function formatOutPacket(source:SC.messageSource,payload:string):string {
  let ret = new SC.ClientMessage(source,SC.OutType.DATA,payload);
  return JSON.stringify(ret);
}

function formatClientsPacket(room:string):string {
  let ret = new SC.RoomData;
  ret.clients = {};
  ret.name = roomList[room].name;
  ret.controller = new SC.ConnInfo(roomList[room].controller.name,
                                   roomList[room].controller.id);

  //for(let client in room.clients) {
  for (let conn in roomList[room].clients) {
    //roomList[connection.room].clients[conn].send(formatOutPacket(source,msg.payload));
    //}
    console.log(conn);
    ret.clients[conn] = new SC.ConnInfo(roomList[room].clients[conn].name,
                                        conn);
  }

  return JSON.stringify(new SC.ClientMessage(SC.messageSource.SERVER,
                                             SC.OutType.ROOM_DATA,
                                             JSON.stringify(ret)));

}


function formatConnectionPacket(id:string,name:string) {
  let packet = {
    id:id,
    name:name
  }
  let ret = new SC.ClientMessage(SC.messageSource.SERVER,
                                 SC.OutType.CONNECT_AWK,
                                 JSON.stringify(packet));
  return JSON.stringify(ret);
}

function formatNewClientPacket(conn:PalaceConn) {
  let packet = new SC.ConnInfo(conn.name,conn.id);

  let ret = new SC.ClientMessage(SC.messageSource.SERVER,
                            SC.OutType.NEW_CLIENT,
                            JSON.stringify(packet));
  return JSON.stringify(ret);
}
/**
 * Adds palace metadata to a basic WS connection
 * @param ws - The WS connection to attach the metadata to
 * @param meta - The metadata to attach
 */
function addMetaWS(ws:WS,meta:ConnMeta): PalaceConn {
  (<any>ws).room = meta.room;
  (<any>ws).id = meta.id;
  (<any>ws).name = meta.name;
  return <PalaceConn>ws;
}

let currID = 100; //TODO: AJH make this random
function getValidID():string {
  let ret = currID;
  currID += 1;
  return "C"+ret;
}

/** Holds metadata */
class ConnMeta {
  room:string;
  name:string;
  id:string;
}

/** Stores all information about a room */
class PalaceRoom {
  /** The room name */
  name:string;
  /** The controller for the room */
  controller:PalaceConn;
  /** An association list between name and PalaceConn */
  clients:any;

  /**
   * Creates a new room
   * @param name - The name of the room
   * @param controller - The controller creating the room
   */
  constructor(name:string,controller:PalaceConn) {
    this.name = name;
    this.controller = controller;
    this.clients = {};
  }
}
