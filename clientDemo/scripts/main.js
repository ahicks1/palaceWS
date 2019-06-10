System.register("protocolCore/socketCore", [], function (exports_1, context_1) {
    "use strict";
    var connectionType, messageTarget, messageSource, serverInTypes, OutType, ConnInfo, RoomData, ServerMessage, ClientMessage;
    var __moduleName = context_1 && context_1.id;
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
    exports_1("parseMessage", parseMessage);
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
    exports_1("getClientInitPacket", getClientInitPacket);
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
    exports_1("getControllerInitPacket", getControllerInitPacket);
    /**
     * Gets a packet set to broadcast to every open connection in the room
     * @param payload - The data to broadcast
     */
    function getPacketAll(payload) {
        var ret = new ServerMessage(messageTarget.ALL, [], payload);
        return JSON.stringify(ret);
    }
    exports_1("getPacketAll", getPacketAll);
    /**
     * Gets a packet to send to the provided targets
     * @param payload - The data to broadcast
     * @param targets - A list of strings naming connections to target
     */
    function getPacket(payload, targets) {
        var ret = new ServerMessage(messageTarget.TARGETED, targets, payload);
        return JSON.stringify(ret);
    }
    exports_1("getPacket", getPacket);
    /**
     * Gets a packet to send to the provided targets
     * @param payload - The data to broadcast
     * @param targets - A list of strings naming connections to target
     */
    function getPacketController(payload) {
        var ret = new ServerMessage(messageTarget.CONTROLLER, [], payload);
        return JSON.stringify(ret);
    }
    exports_1("getPacketController", getPacketController);
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
            (function (messageSource) {
                messageSource[messageSource["SERVER"] = 0] = "SERVER";
                messageSource[messageSource["CONTROLLER"] = 1] = "CONTROLLER";
                messageSource[messageSource["CLIENT"] = 2] = "CLIENT";
            })(messageSource || (messageSource = {}));
            exports_1("messageSource", messageSource);
            /** Types a message targeting the server can have */
            (function (serverInTypes) {
                serverInTypes[serverInTypes["START"] = 0] = "START";
                serverInTypes[serverInTypes["JOIN"] = 1] = "JOIN";
                serverInTypes[serverInTypes["GET_CLIENTS"] = 2] = "GET_CLIENTS";
                serverInTypes[serverInTypes["CONFIGURE"] = 3] = "CONFIGURE"; //Set room settings TODO
            })(serverInTypes || (serverInTypes = {}));
            exports_1("serverInTypes", serverInTypes);
            /** Types a message coming from the server can have */
            (function (OutType) {
                OutType[OutType["DATA"] = 0] = "DATA";
                OutType[OutType["CONNECT_AWK"] = 1] = "CONNECT_AWK";
                OutType[OutType["NEW_CLIENT"] = 2] = "NEW_CLIENT";
                OutType[OutType["LOST_CLIENT"] = 3] = "LOST_CLIENT";
                OutType[OutType["ROOM_DATA"] = 4] = "ROOM_DATA";
                OutType[OutType["CONFIGURATION"] = 5] = "CONFIGURATION"; //Room configuration object TODO
            })(OutType || (OutType = {}));
            exports_1("OutType", OutType);
            ConnInfo = /** @class */ (function () {
                function ConnInfo(name, id) {
                    //this.room = room;
                    this.name = name;
                    this.id = id;
                }
                return ConnInfo;
            }());
            exports_1("ConnInfo", ConnInfo);
            RoomData = /** @class */ (function () {
                function RoomData() {
                }
                return RoomData;
            }());
            exports_1("RoomData", RoomData);
            /** Class representing an outbound message */
            ServerMessage = /** @class */ (function () {
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
            exports_1("ServerMessage", ServerMessage);
            /** Class representing an inbound message */
            ClientMessage = /** @class */ (function () {
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
            exports_1("ClientMessage", ClientMessage);
        }
    };
});
System.register("clientDemo/clientProtocol", ["protocolCore/socketCore"], function (exports_2, context_2) {
    "use strict";
    var SC, websocket, room, username, id, $, selector, messageArea;
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
        var targets = [];
        for (var i = 0; i < selector.selectedOptions.length; i++) {
            console.log(selector.selectedOptions[i].value);
            targets.push(selector.selectedOptions[i].value);
        }
        var message = document.getElementById('message_field').value;
        if (targets.lastIndexOf("All") != -1) {
            console.log("broadcasting to all");
            websocket.send(SC.getPacketAll(message));
        }
        else if (targets.lastIndexOf("Controller") != -1) {
            websocket.send(SC.getPacketController(message));
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
        var message = SC.parseMessage(ev.data);
        if (message != undefined) {
            if (message.source == SC.messageSource.SERVER) {
                //Message is from the server, usually a client connected or disconnected
                console.log(message.payload);
                if (message.type == SC.OutType.CONNECT_AWK) {
                    id = JSON.parse(message.payload).id; //TODO: AJH try ... catch!
                }
                else if (message.type == SC.OutType.ROOM_DATA) {
                    //updateClientList()
                    console.log("room info");
                    console.log(message.payload);
                    var packet = JSON.parse(message.payload);
                    if (packet.controller.id != id) {
                        selector.add(new Option(packet.controller.name, packet.controller.id, false, false));
                    }
                    for (var i in packet.clients) {
                        var client = packet.clients[i];
                        console.log(JSON.stringify(client));
                        if (client.id != id)
                            selector.add(new Option(client.name, client.id, false, false));
                    }
                    $('select').material_select();
                }
                else if (message.type == SC.OutType.NEW_CLIENT) {
                    console.log("adding to select");
                    var packet = JSON.parse(message.payload);
                    selector.add(new Option(packet.name, packet.id, false, false));
                    $('select').material_select();
                }
            }
            else {
                var str = message.source == SC.messageSource.CONTROLLER
                    ? "\n Controller says: " + message.payload
                    : "\n" + message.payload;
                messageArea.innerText += str;
            }
        }
    }
    return {
        setters: [
            function (SC_1) {
                SC = SC_1;
            }
        ],
        execute: function () {
            document.getElementById('join_button').onclick = joinClicked;
            selector = document.getElementById('target');
            document.getElementById('send_button').onclick = messageClicked;
            messageArea = document.getElementById('messages');
        }
    };
});
