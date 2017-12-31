System.register("protocolCore/socketCore", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
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
    exports_1("getClientInitPacket", getClientInitPacket);
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
    exports_1("getControllerInitPacket", getControllerInitPacket);
    var connectionType, messageTarget, serverMessage;
    return {
        setters: [],
        execute: function () {
            /** Enum indicating if a connection is a controller or a client */
            (function (connectionType) {
                connectionType[connectionType["CONTROLLER"] = 0] = "CONTROLLER";
                connectionType[connectionType["CLIENT"] = 1] = "CLIENT";
            })(connectionType || (connectionType = {}));
            exports_1("connectionType", connectionType);
            (function (messageTarget) {
                messageTarget[messageTarget["ALL"] = 0] = "ALL";
                messageTarget[messageTarget["CONTROLLER"] = 1] = "CONTROLLER";
                messageTarget[messageTarget["TARGETED"] = 2] = "TARGETED";
                messageTarget[messageTarget["SERVER"] = 3] = "SERVER"; //Sent to the server
            })(messageTarget || (messageTarget = {}));
            exports_1("messageTarget", messageTarget);
            /** Class representing an outbound message */
            serverMessage = (function () {
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
            exports_1("serverMessage", serverMessage);
        }
    };
});
System.register("controllerDemo/controllerProtocol", ["protocolCore/socketCore"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    function joinClicked(event) {
        console.log("join pressed");
        websocket = new WebSocket("ws://localhost:8080"); //NOTE: change this later to be any IP
        websocket.onopen = yesConnect;
    }
    function yesConnect() {
        username = document.getElementById('username_field').value;
        room = document.getElementById('room_field').value;
        websocket.send(SC.getControllerInitPacket(username, room));
    }
    var SC, websocket, room, username;
    return {
        setters: [
            function (SC_1) {
                SC = SC_1;
            }
        ],
        execute: function () {
            document.getElementById('join_button').onclick = joinClicked;
        }
    };
});
