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
/** Types a message targeting the server can have */
var serverTargetTypes;
(function (serverTargetTypes) {
    serverTargetTypes[serverTargetTypes["START"] = 0] = "START";
    serverTargetTypes[serverTargetTypes["JOIN"] = 1] = "JOIN";
    serverTargetTypes[serverTargetTypes["GET_CLIENTS"] = 2] = "GET_CLIENTS";
    serverTargetTypes[serverTargetTypes["CONFIGURE"] = 3] = "CONFIGURE"; //Set room settings TODO
})(serverTargetTypes = exports.serverTargetTypes || (exports.serverTargetTypes = {}));
/** Types a message coming from the server can have */
var serverOutTypes;
(function (serverOutTypes) {
    serverOutTypes[serverOutTypes["NEW_CLIENT"] = 0] = "NEW_CLIENT";
    serverOutTypes[serverOutTypes["LOST_CLIENT"] = 1] = "LOST_CLIENT";
    serverOutTypes[serverOutTypes["CONFIGURATION"] = 2] = "CONFIGURATION"; //Room configuration object TODO
})(serverOutTypes = exports.serverOutTypes || (exports.serverOutTypes = {}));
/** Class representing an outbound message */
var serverMessage = (function () {
    /**
     * Create a new serverMessage
     * @param target - a messageTarget representing the destination
     * @param tags - The list of targets by name when targeted
     * @param data - The payload that gets stringified
     */
    function serverMessage(target, tags, data) {
        this.target = target;
        this.tags = tags;
        this.payload = JSON.stringify(data);
    }
    return serverMessage;
}());
exports.serverMessage = serverMessage;
/**
 * Formats a packet for a client to send after connecting
 * @param name - The display name for the client
 * @param room - The room for the client to join
 */
function getClientInitPacket(name, room) {
    var clientInfo = {
        type: connectionType.CLIENT,
        room: room,
        name: name
    };
    //Empty target
    var ret = new serverMessage(messageTarget.SERVER, [], clientInfo);
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
        type: connectionType.CONTROLLER,
        room: room,
        name: name
    };
    var ret = new serverMessage(messageTarget.SERVER, [], controllerInfo);
    return JSON.stringify(ret);
}
exports.getControllerInitPacket = getControllerInitPacket;
function getPacketAll(payload) {
    var ret = new serverMessage(messageTarget.ALL, [], payload);
    return JSON.stringify(ret);
}
exports.getPacketAll = getPacketAll;
function getPacket(payload, targets) {
    var ret = new serverMessage(messageTarget.TARGETED, targets, payload);
    return JSON.stringify(ret);
}
exports.getPacket = getPacket;
