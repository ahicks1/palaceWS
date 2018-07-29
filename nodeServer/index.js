const WebSocket = require('ws');
const Ajv = require('ajv');
const fs = require('fs');
const log = require('./log');




const wss = new WebSocket.Server({ port: 8080 });
const TAG = "Main";

//Start validation constants
var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
var messageValidator = getValidator("outboundMessage.json");

/** Called whenever a new connection is recieved */
wss.on('connection', function connection(ws) {
  log.info(TAG,'New Connection, waiting for init message');

  /** Event listener handling incoming messages*/
  ws.on('message', function incoming(raw) {
    log.info(TAG,'received: '+ raw);
    //Try parsing and validating message
    try {
      let message = JSON.parse(raw);
      var valid = messageValidator(message);
      if (!valid) {

        log.error(TAG,JSON.stringify(messageValidator.errors));
        throw "Invalid message"
      }
    } catch (e) {
      log.error(TAG,"Invalid JSON")
      ws.send('[ERROR] invalid message');
      ws.close();
      return;
    }
    ws.send('[SUCCESS] valid message');
    log.info(TAG,'Valid message!');


  });

  ws.send('something');
});

/**
 * Get the json validator for a given json schema file
 */
function getValidator(filename) {
  let text = fs.readFileSync('../messageSchema/'+filename);
  let obj = JSON.parse(text);
  let validator = ajv.compile(obj);
  return validator;
}
