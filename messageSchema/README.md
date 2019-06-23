# Palace

Palace is a networking system build for Node.js using typescript. Connections are established over the WebSocket protocol.

The basic design is a system of rooms where each room has a controller and a number of clients. The clients and the controller can send messages to any combination of other clients in the "room". This was designed with the idea of sending JSON strings between clients in a multiplayer game.

The server handles relaying all messages between destinations and handles all connection initialization or cleanup.

The controller is notified whenever a client connects, but notifying the clients of another connection must be done by the controller implementation if needed.

## Requirements:
 ### Server :
   * Node.js
 ### Demo apps:
   * WebSocket supported browser
 ### Development:
   * Node.js
   * Typescript

# Server

This is the primary Node application. It binds to port 8080 by default and depends on the ws module.

### Use:
Ensure the source is compiled by running `tsc` in the server directory then start the server with  `node out/server/serverMain.js`

# Demo applications

Both demo applications are build to run in browser using system.js module loader. The front end is using the materialize framework.

By default these demo apps attempt to connect to `ws://localhost:8080`

### Use:
The sources should also be compiled with `tsc`

## Demo controller

The controller when connected creates a new room with the given name. When connection to controller is lost current version closes all connections in the room and then deletes room.

## Demo client

The client only connects if the given room name actually exists (contains a controller).
