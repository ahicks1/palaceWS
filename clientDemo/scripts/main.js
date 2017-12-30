System.register("protocolCore/socketCore", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function getClientInitPacket(name, room) {
        var clientInfo = {
            type: connectionType.CLIENT,
            room: room,
            name: name
        };
        var ret = new serverMessage([], clientInfo);
        return JSON.stringify(ret);
    }
    exports_1("getClientInitPacket", getClientInitPacket);
    function getControllerInitPacket(name, room) {
        var controllerInfo = {
            type: connectionType.CONTROLLER,
            room: room,
            name: name
        };
        var ret = new serverMessage([], controllerInfo);
        return JSON.stringify(ret);
    }
    exports_1("getControllerInitPacket", getControllerInitPacket);
    var connectionType, serverMessage;
    return {
        setters: [],
        execute: function () {
            (function (connectionType) {
                connectionType[connectionType["CONTROLLER"] = 0] = "CONTROLLER";
                connectionType[connectionType["CLIENT"] = 1] = "CLIENT";
            })(connectionType || (connectionType = {}));
            exports_1("connectionType", connectionType);
            serverMessage = (function () {
                function serverMessage(ts, data) {
                    this.targets = ts;
                    this.payload = JSON.stringify(data);
                }
                return serverMessage;
            }());
            exports_1("serverMessage", serverMessage);
            /*export function getServerMessage(targets:string[],data:Object): serverMessage {
              let msg = new serverMessage();
              return msg;
            }*/
        }
    };
});
System.register("clientDemo/clientProtocol", ["protocolCore/socketCore"], function (exports_2, context_2) {
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
        websocket.send(SC.getClientInitPacket(username, room));
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
