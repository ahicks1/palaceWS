"use strict";
exports.__esModule = true;
var connectionType;
(function (connectionType) {
    connectionType[connectionType["CONTROLLER"] = 0] = "CONTROLLER";
    connectionType[connectionType["CLIENT"] = 1] = "CLIENT";
})(connectionType = exports.connectionType || (exports.connectionType = {}));
var serverMessage = (function () {
    function serverMessage(ts, data) {
        this.targets = ts;
        this.payload = JSON.stringify(data);
    }
    return serverMessage;
}());
exports.serverMessage = serverMessage;
function getClientInitPacket(name, room) {
    var clientInfo = {
        type: connectionType.CLIENT,
        room: room,
        name: name
    };
    var ret = new serverMessage([], clientInfo);
    return JSON.stringify(ret);
}
exports.getClientInitPacket = getClientInitPacket;
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
/*export function getServerMessage(targets:string[],data:Object): serverMessage {
  let msg = new serverMessage();
  return msg;
}*/
