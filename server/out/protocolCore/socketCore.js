"use strict";
exports.__esModule = true;
/** Enum indicating if a connection is a controller or a client */
var connectionType;
(function (connectionType) {
    connectionType[connectionType["CONTROLLER"] = 0] = "CONTROLLER";
    connectionType[connectionType["CLIENT"] = 1] = "CLIENT";
})(connectionType = exports.connectionType || (exports.connectionType = {}));
var messageTarget;
(function (messageTarget) {
    messageTarget[messageTarget["ALL"] = 0] = "ALL";
    messageTarget[messageTarget["CONTROLLER"] = 1] = "CONTROLLER";
    messageTarget[messageTarget["TARGETED"] = 2] = "TARGETED";
    messageTarget[messageTarget["SERVER"] = 3] = "SERVER"; //Sent to the server
})(messageTarget = exports.messageTarget || (exports.messageTarget = {}));
var messageSource;
(function (messageSource) {
    messageSource[messageSource["SERVER"] = 0] = "SERVER";
    messageSource[messageSource["CONTROLLER"] = 1] = "CONTROLLER";
    messageSource[messageSource["CLIENT"] = 2] = "CLIENT";
})(messageSource = exports.messageSource || (exports.messageSource = {}));
/** Types a message targeting the server can have */
var serverInTypes;
(function (serverInTypes) {
    serverInTypes[serverInTypes["START"] = 0] = "START";
    serverInTypes[serverInTypes["JOIN"] = 1] = "JOIN";
    serverInTypes[serverInTypes["GET_CLIENTS"] = 2] = "GET_CLIENTS";
    serverInTypes[serverInTypes["CONFIGURE"] = 3] = "CONFIGURE"; //Set room settings TODO
})(serverInTypes = exports.serverInTypes || (exports.serverInTypes = {}));
/** Types a message coming from the server can have */
var OutType;
(function (OutType) {
    OutType[OutType["DATA"] = 0] = "DATA";
    OutType[OutType["CONNECT_AWK"] = 1] = "CONNECT_AWK";
    OutType[OutType["NEW_CLIENT"] = 2] = "NEW_CLIENT";
    OutType[OutType["LOST_CLIENT"] = 3] = "LOST_CLIENT";
    OutType[OutType["ROOM_DATA"] = 4] = "ROOM_DATA";
    OutType[OutType["CONFIGURATION"] = 5] = "CONFIGURATION"; //Room configuration object TODO
})(OutType = exports.OutType || (exports.OutType = {}));
var ConnInfo = (function () {
    function ConnInfo(room, name, id) {
        this.room = room;
        this.name = name;
        this.id = id;
    }
    return ConnInfo;
}());
exports.ConnInfo = ConnInfo;
var RoomData = (function () {
    function RoomData() {
    }
    return RoomData;
}());
exports.RoomData = RoomData;
/** Class representing an outbound message */
var ServerMessage = (function () {
    /**
     * Create a new ServerMessage
     * @param target - a messageTarget representing the destination
     * @param tags - The list of targets by name when targeted
     * @param data - The payload as a string
     */
    function ServerMessage(target, tags, data) {
        this.target = target;
        this.tags = tags;
        this.payload = data;
    }
    return ServerMessage;
}());
exports.ServerMessage = ServerMessage;
/** Class representing an inbound message */
var ClientMessage = (function () {
    /**
     * Create a new ClientMessage
     * @param source - a messageSource representing the source
     * @param data - The payload as a string
     */
    function ClientMessage(source, type, data) {
        this.source = source;
        this.type = type;
        this.payload = data;
    }
    return ClientMessage;
}());
exports.ClientMessage = ClientMessage;
/**
 * Parses a message from string(returns undefined if unable to parse)
 * @param src - The source string to be converted
 */
function parseMessage(src) {
    var ret;
    try {
        var obj = JSON.parse(src);
        if (obj.source != undefined &&
            obj.payload != undefined &&
            obj.type != undefined) {
            ret = new ClientMessage(obj.source, obj.type, obj.payload);
        }
    }
    catch (e) {
        return undefined;
    }
    return ret;
}
exports.parseMessage = parseMessage;
/**
 * Formats a packet for a client to send after connecting
 * @param name - The display name for the client
 * @param room - The room for the client to join
 */
function getClientInitPacket(name, room) {
    var clientInfo = {
        type: serverInTypes.JOIN,
        room: room,
        name: name
    };
    //Empty target
    var ret = new ServerMessage(messageTarget.SERVER, [], JSON.stringify(clientInfo));
    return JSON.stringify(ret);
}
exports.getClientInitPacket = getClientInitPacket;
/**
 * Same as getClientInitPacket but for the controller
 * @param name - The display name for the controller
 * @param room - The room for the controller to join
 */
function getControllerInitPacket(name, room) {
    var controllerInfo = {
        type: serverInTypes.START,
        room: room,
        name: name
    };
    var ret = new ServerMessage(messageTarget.SERVER, [], JSON.stringify(controllerInfo));
    return JSON.stringify(ret);
}
exports.getControllerInitPacket = getControllerInitPacket;
/**
 * Gets a packet set to broadcast to every open connection in the room
 * @param payload - The data to broadcast
 */
function getPacketAll(payload) {
    var ret = new ServerMessage(messageTarget.ALL, [], payload);
    return JSON.stringify(ret);
}
exports.getPacketAll = getPacketAll;
/**
 * Gets a packet to send to the provided targets
 * @param payload - The data to broadcast
 * @param targets - A list of strings naming connections to target
 */
function getPacket(payload, targets) {
    var ret = new ServerMessage(messageTarget.TARGETED, targets, payload);
    return JSON.stringify(ret);
}
exports.getPacket = getPacket;
/**
 * Gets a packet to send to the provided targets
 * @param payload - The data to broadcast
 * @param targets - A list of strings naming connections to target
 */
function getPacketController(payload) {
    var ret = new ServerMessage(messageTarget.CONTROLLER, [], payload);
    return JSON.stringify(ret);
}
exports.getPacketController = getPacketController;
