# Protocol design

When sending a message send a stringified serverMessage object over the websocket connection. The server will then deliver the payload to the targets.

## Connecting:
A message received by the server with an empty target field will be processed by the server itself. This is used to send client information after a connection is established

## Broadcasting:
If you want a message sent to all other clients or all other open connections use the list of special targets:
* all
* allClients
* controller
