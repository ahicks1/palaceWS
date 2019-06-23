# Palace Server

Palace is a networking system build for Node.js. Connections are established over the WebSocket protocol.

The basic design is a system of rooms where each room has a controller and a number of clients. The clients and the controller can send messages to any combination of other clients in the "room". This was designed with the idea of sending JSON strings between clients in a multiplayer game.

The server handles relaying all messages between destinations and handles all connection initialization or cleanup.

## Protocol:

### Connecting
To start a new palace room open a websocket connection to `ws://${url}/start?name=${name}`

To connect to an existing room open a websocket connection to `ws://${url}/join?room=${room}&name=${name}`

TODO: Support reconnecting as same client by supplying id and secret

### Sending Messages

Messages sent to the server must be JSON with following fields: (see full schema [here](messageSchema/inboundMessage.schema.json))
* **target**: one of "SERVER", "CONTROLLER", "TARGETED", "ALL", or "CLIENTS"
* **tags**: an optional list of endpoints for TARGETED messages by 8 character hex ID
* **type**: one of "DATA", "GET_ROOM", or "CONFIGURE". This is always "DATA" unless the target is "SERVER"
* **payload**: usually stringified json, if type is "CONFIGURE" see schema [here](messageSchema/roomConfiguration.schema.json)

### Recieving Messages

Messages recieved from the server will be JSON with following fields: (see full schema [here](messageSchema/outboundMessage.schema.json))
* **source**: one of "SERVER", "CONTROLLER", or "CLIENT"
* **source-id**: an optional 8 character hex ID identifying the source for CLINET messages
* **type**: one of "DATA", "CLIENT_ADDED", "CLIENT_REMOVED", "CONFIGURATION", or "SERVER_INFORMATION". This is always "DATA" unless the source is "SERVER"
* **payload**: usually stringified json, if type is "CONFIGURE" see schema [here](messageSchema/roomConfiguration.schema.json)