"use strict";
exports.__esModule = true;
/** Enum indicating if a connection is a controller or a client */
var connectionType;
(function (connectionType) {
    connectionType[connectionType["CONTROLLER"] = 0] = "CONTROLLER";
    connectionType[connectionType["CLIENT"] = 1] = "CLIENT";
})(connectionType = exports.connectionType || (exports.connectionType = {}));
/** Class representing an outbound message */
var serverMessage = (function () {
    /**
     * Create a new serverMessage
     * @param ts - The list of targets by name; blank for init
     * @param data - The payload that gets stringified
     */
    function serverMessage(ts, data) {
        this.targets = ts;
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
    var ret = new serverMessage([], clientInfo);
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
    var ret = new serverMessage([], controllerInfo);
    return JSON.stringify(ret);
}
exports.getControllerInitPacket = getControllerInitPacket;
