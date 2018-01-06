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
    function getPacketAll(payload) {
        var ret = new serverMessage(messageTarget.ALL, [], payload);
        return JSON.stringify(ret);
    }
    exports_1("getPacketAll", getPacketAll);
    function getPacket(payload, targets) {
        var ret = new serverMessage(messageTarget.TARGETED, targets, payload);
        return JSON.stringify(ret);
    }
    exports_1("getPacket", getPacket);
    var connectionType, messageTarget, serverTargetTypes, serverOutTypes, serverMessage;
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
            /** Types a message targeting the server can have */
            (function (serverTargetTypes) {
                serverTargetTypes[serverTargetTypes["START"] = 0] = "START";
                serverTargetTypes[serverTargetTypes["JOIN"] = 1] = "JOIN";
                serverTargetTypes[serverTargetTypes["GET_CLIENTS"] = 2] = "GET_CLIENTS";
                serverTargetTypes[serverTargetTypes["CONFIGURE"] = 3] = "CONFIGURE"; //Set room settings TODO
            })(serverTargetTypes || (serverTargetTypes = {}));
            exports_1("serverTargetTypes", serverTargetTypes);
            /** Types a message coming from the server can have */
            (function (serverOutTypes) {
                serverOutTypes[serverOutTypes["NEW_CLIENT"] = 0] = "NEW_CLIENT";
                serverOutTypes[serverOutTypes["LOST_CLIENT"] = 1] = "LOST_CLIENT";
                serverOutTypes[serverOutTypes["CONFIGURATION"] = 2] = "CONFIGURATION"; //Room configuration object TODO
            })(serverOutTypes || (serverOutTypes = {}));
            exports_1("serverOutTypes", serverOutTypes);
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
System.register("clientDemo/clientProtocol", ["protocolCore/socketCore"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    function joinClicked(event) {
        console.log("join pressed");
        var ip = window.location.hostname; //(<HTMLInputElement> document.getElementById('ip_field')).value;
        //if(ip == "") ip = window.location.hostname;
        websocket = new WebSocket("ws://" + ip + ":8080"); //NOTE: change this later to be any IP
        websocket.onopen = yesConnect;
        websocket.onmessage = messageHandler;
    }
    function messageClicked(event) {
        var selector = document.getElementById('target');
        var targets = [];
        for (var i = 0; i < selector.selectedOptions.length; i++) {
            console.log(selector.selectedOptions[i].text);
            targets.push(selector.selectedOptions[i].text);
        }
        var message = document.getElementById('message_field').value;
        if (targets.lastIndexOf("All") != -1) {
            console.log("broadcasting to all");
            websocket.send(SC.getPacketAll(message));
        }
        else {
            websocket.send(SC.getPacket(message, targets));
        }
        //targets.add(new Option("text", "value", false, false));
        //(<any>$('select')).material_select();
    }
    function yesConnect() {
        username = document.getElementById('username_field').value;
        room = document.getElementById('room_field').value;
        if (document.getElementById('controller_field').checked == true) {
            console.log("ischecked");
            websocket.send(SC.getControllerInitPacket(username, room));
        }
        else {
            websocket.send(SC.getClientInitPacket(username, room));
        }
    }
    function messageHandler(ev) {
        messageArea.innerText += "\n" + ev.data;
    }
    var SC, messageArea, websocket, room, username;
    return {
        setters: [
            function (SC_1) {
                SC = SC_1;
            }
        ],
        execute: function () {
            document.getElementById('join_button').onclick = joinClicked;
            document.getElementById('send_button').onclick = messageClicked;
            messageArea = document.getElementById('messages');
        }
    };
});
