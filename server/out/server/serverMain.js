"use strict";
exports.__esModule = true;
var WS = require("ws");
var SC = require("../protocolCore/socketCore");
/** An association list between id and PalaceRoom */
var roomList = {};
//Start the server
var server = new WS.Server({ port: 8080 });
console.log("started");
server.on('connection', handleNewConnection);
/** Called whenever a new connection is recieved */
function handleNewConnection(ws, req) {
    console.log('New Connection, waiting for init message');
    /** Intersection type adding palace data to ws connection */
    var connection = addMetaWS(ws, new ConnMeta);
    /** Event listener handling incoming messages*/
    ws.on('message', function incoming(raw) {
        //TODO: AJH ensure that 'raw' can be parsed
        var msg = JSON.parse(raw.toString());
        console.log(raw.toString());
        // Handle init message
        if (connection.room == undefined && msg.target == SC.messageTarget.SERVER) {
            console.log("Init message:" + msg.payload);
            //TODO: AJH ensure that 'msg.payload' can be parsed
            var init = JSON.parse(msg.payload);
            // Check if controller or client
            if (init.type == SC.serverInTypes.START) {
                // Ensure room doesn't exist already
                if (init.room != undefined &&
                    init.name != undefined &&
                    roomList[init.room] == undefined) {
                    connection.room = init.room;
                    connection.id = getValidID();
                    connection.name = init.name;
                    // Store the new room in the list of rooms
                    roomList[init.room] = new PalaceRoom(init.room, connection);
                    connection.send(formatConnectionPacket(connection.id, connection.name));
                    console.log("created new room with name: " + init.room);
                }
                else {
                    // Drop connection because room already exists
                    connection.close(1000, "Room already exists");
                }
            }
            else if (init.type == SC.serverInTypes.JOIN) {
                // Only connect if
                if (roomList[init.room] != undefined) {
                    connection.room = init.room;
                    connection.id = getValidID();
                    connection.name = init.name;
                    roomList[init.room].clients[init.id] = connection;
                    //sent id to connection
                    connection.send(formatConnectionPacket(connection.id, connection.name));
                    console.log("client " + init.name + " joined " + init.room);
                }
                else {
                    console.log("room doesn't exist");
                }
            }
            //Handle standard ServerMessage
        }
        else if (connection.room != undefined &&
            msg.target != SC.messageTarget.SERVER) {
            //Check if connection is controller
            var source = roomList[connection.room].controller.id == connection.id
                ? SC.messageSource.CONTROLLER
                : SC.messageSource.CLIENT;
            //Determine endpoints
            if (msg.target == SC.messageTarget.CONTROLLER) {
                roomList[connection.room].controller.send(formatOutPacket(source, msg.payload));
            }
            else if (msg.target == SC.messageTarget.ALL) {
                for (var conn in roomList[connection.room].clients) {
                    roomList[connection.room].clients[conn].send(formatOutPacket(source, msg.payload));
                }
                roomList[connection.room].controller.send(formatOutPacket(source, msg.payload));
            }
            else if (msg.target == SC.messageTarget.TARGETED) {
                for (var _i = 0, _a = msg.tags; _i < _a.length; _i++) {
                    var conn = _a[_i];
                    if (roomList[connection.room].clients[conn] != undefined) {
                        roomList[connection.room].clients[conn].send(formatOutPacket(source, msg.payload));
                    }
                    else if (roomList[connection.room].controller.id == conn) {
                        roomList[connection.room].controller.send(formatOutPacket(source, msg.payload));
                    }
                }
            }
            else {
                //Message is meant for server; Ignoring for now
            }
            //Handle unkown message by terminating connection
        }
        else {
            connection.close(1000, "Unexpected message sent before init");
        }
    });
    /* Event listener handling closed connection events */
    ws.on('close', function closed(code, reason) {
        //Ensure connection both contained a room and the room exists
        if (connection.room != undefined && roomList[connection.room] != undefined) {
            if (roomList[connection.room].controller.id == connection.id) {
                //Connection closed was the controller; delete all clients
                console.log("controller connection closed, deleting room");
                for (var c in roomList[connection.room].clients) {
                    console.log(c);
                    roomList[connection.room].clients[c].close(1000, "controller disconnected");
                    delete roomList[connection.room].clients[c];
                }
                //All clients are deleted; delete room
                delete roomList[connection.room];
            }
            else {
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
function formatOutPacket(source, payload) {
    var ret = new SC.ClientMessage(source, SC.OutType.DATA, payload);
    return JSON.stringify(ret);
}
function formatConnectionPacket(id, name) {
    var packet = {
        id: id,
        name: name
    };
    var ret = new SC.ClientMessage(SC.messageSource.SERVER, SC.OutType.CONNECT_AWK, JSON.stringify(packet));
    return JSON.stringify(ret);
}
/**
 * Adds palace metadata to a basic WS connection
 * @param ws - The WS connection to attach the metadata to
 * @param meta - The metadata to attach
 */
function addMetaWS(ws, meta) {
    ws.room = meta.room;
    ws.id = meta.id;
    ws.name = meta.name;
    return ws;
}
var currID = 100; //TODO: AJH make this random
function getValidID() {
    var ret = currID;
    currID += 1;
    return ret.toString();
}
/** Holds metadata */
var ConnMeta = (function () {
    function ConnMeta() {
    }
    return ConnMeta;
}());
/** Stores all information about a room */
var PalaceRoom = (function () {
    /**
     * Creates a new room
     * @param name - The name of the room
     * @param controller - The controller creating the room
     */
    function PalaceRoom(name, controller) {
        this.name = name;
        this.controller = controller;
        this.clients = {};
    }
    return PalaceRoom;
}());
