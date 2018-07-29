# Protocol design

When sending a message send a stringified serverMessage object over the websocket connection. The server will then deliver the payload to the targets.


## Broadcasting:
If you want a message sent to all other clients or all other open connections use the list of special targets:
* all
* allClients
* controller

## Outbound Message:

```
$id: http://bitwarpdesign.com/palace/outboundMessage.json
type: object
properties:
  target:
    $id: /properties/target
    type: string
    title: 'Message Target'
    examples:
    - SERVER
    enum:
    - SERVER
    - CONTROLLER
    - TARGETED
    - ALL
    - CLIENTS
  tags:
    $id: /properties/tags
    type: array
    items:
      $id: /properties/tags/items
      type: string
      title: 'Tag Element'
      description: Used as the list of endpoints for TARGETED messages by 8 character
        hex ID
      default: ''
      examples:
      - 1234ABCD
      pattern: /[0-9a-f]{8}/i"
  payload:
    $id: /properties/payload
    type: string
    title: 'Message Payload'
    description: The payload of the message as stringified json usually passed through
      to the target
    default: '{}'
    examples:
    - '{"test":1234}'
required:
- target
- payload```
