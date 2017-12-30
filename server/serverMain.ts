import * as WS from "ws";
import * as SC from "../protocolCore/socketCore"
import * as http from 'http';

let gamelst:any = {}; //An association list between name and serverGame
const server = new WS.Server({ port: 8080 });
server.on('connection', handleNewConnection);

console.log("started");
//let msg = new SC.serverMessage(["1","Hello"],{name:"Dude"});


function handleNewConnection(ws:WS,req:http.IncomingMessage) {
  console.log('New Connection, waiting for init message');
  let meta = addMetaWS(ws,new connMeta);

  ws.on('message', function incoming(raw) {
    let msg: SC.serverMessage = JSON.parse(raw.toString());
    //console.log(meta.room);

    //Handle init message
    if(meta.room == undefined && msg.targets.length == 0) {
      console.log("Init message:" +msg.payload);
      let init = JSON.parse(msg.payload);

      //Check if controller or client
      if(init.type == SC.connectionType.CONTROLLER) {


        if(init.room != undefined && init.name != undefined ) {
          meta.room = init.room;
          meta.publicName = init.name;
          gamelst[init.room] = new serverGame(init.room,meta);
          console.log("created new game with name: "+init.room);

        }
      } else if(init.type == SC.connectionType.CLIENT) {
        //check to see if game exists
        if(gamelst[init.room] != undefined) {
          meta.room = init.room;
          meta.publicName = init.name;
          gamelst[init.room].clients[init.name] = meta;
          console.log("client "+init.name+" joined "+init.room);
        } else {
          console.log("room doesn't exist");
        }
      }
    //Handle standard serverMessage
  } else if(meta.room != undefined && msg.targets.length == 0){

    }





  });


  ws.on('close', function closed(code,reason) {
    if(meta.room != undefined && gamelst[meta.room] != undefined) {
      if(gamelst[meta.room].controller.publicName == meta.publicName) {
        //Connection closed was the controller; delete all clients
        console.log("controller connection closed, deleting game");
        for (let c in gamelst[meta.room].clients) {
          console.log(c);
          gamelst[meta.room].clients[c].close(1000,"controller disconnected");
          delete gamelst[meta.room].clients[c]; // = undefined;
        }
        //All clients are deleted; delete room
        delete gamelst[meta.room];// = undefined;


      } else {
        console.log("client connection closed");
        delete gamelst[meta.room].clients[meta.publicName] //= undefined;
      }
  }
  });


}

function addMetaWS(ws:WS,meta:connMeta): palaceConn {
  (<any>ws).room = meta.room;
  (<any>ws).publicName = meta.publicName;
  return <palaceConn>ws;
}
type palaceConn = WS & connMeta;

class connMeta {
  room:string;
  publicName:string;
}
class serverGame {
  name:string;
  controller:connMeta;
  clients:any; //an association list between name and palaceConn
  constructor(name:string,controller:connMeta) {
    this.name = name;
    this.controller = controller;
    this.clients = {};
  }
}
