import * as SC from "../protocolCore/socketCore"
import {ServerConnection,connectionStatus} from "../protocolCore/ServerConnectionAPI"

document.getElementById('join_button').onclick = joinClicked;


var websocket:WebSocket;
var room;
var username;
var id: string;
var $:any;
var server:ServerConnection;

function joinClicked(event:Event) {
	console.log("join pressed");
  let ip = window.location.hostname;//(<HTMLInputElement> document.getElementById('ip_field')).value;
	let username = (<HTMLInputElement> document.getElementById('username_field')).value;
	let room = (<HTMLInputElement> document.getElementById('room_field')).value;
  let isCont = (<HTMLInputElement> document.getElementById('controller_field')).checked
						 ? SC.connectionType.CONTROLLER
						 : SC.connectionType.CLIENT;

	if(ip == "") ip = window.location.hostname;
	//websocket = new WebSocket("ws://"+ip+":8080"); //NOTE: change this later to be any IP
	server = new ServerConnection(isCont,room,username,"ws://"+ip+":8080");
	server.stateChangeCallback = yesConnect;
	server.messageCallback = messageHandler;
	server.eventCallback = messageHandler;
	//websocket.onmessage = messageHandler;
}

let selector = (<HTMLSelectElement> document.getElementById('target'));
document.getElementById('send_button').onclick = messageClicked;
function messageClicked(event:Event) {

	let targets = [];
	for(let i = 0; i < selector.selectedOptions.length; i++) {
		console.log(selector.selectedOptions[i].value);
		targets.push(selector.selectedOptions[i].value);

	}

	let message = (<HTMLInputElement> document.getElementById('message_field')).value;
	if(targets.lastIndexOf("All") != -1){
		console.log("broadcasting to all");
		server.ws.send(SC.getPacketAll(message));
	} else if(targets.lastIndexOf("Controller") != -1){
		server.ws.send(SC.getPacketController(message));
	} else {
		server.ws.send(SC.getPacket(message,targets));
	}
	//targets.add(new Option("text", "value", false, false));
	//(<any>$('select')).material_select();



}

let messageArea = document.getElementById('messages');



function yesConnect(state:connectionStatus): void{
	/*username = (<HTMLInputElement> document.getElementById('username_field')).value;
	room = (<HTMLInputElement> document.getElementById('room_field')).value;
  if((<HTMLInputElement> document.getElementById('controller_field')).checked == true) {
   console.log("ischecked")
	 websocket.send(SC.getControllerInitPacket(username,room));
 } else {
   websocket.send(SC.getClientInitPacket(username,room));
 }*/
 console.log("New state! "+state);

}

function messageHandler(msg:SC.ClientMessage):any {
	let message = msg;//SC.parseMessage(ev.data);
	if(message != undefined) {
		if(message.source == SC.messageSource.SERVER) {
			//Message is from the server, usually a client connected or disconnected
			console.log(message.payload);
			if(message.type == SC.OutType.CONNECT_AWK) {
				id = JSON.parse(message.payload).id; //TODO: AJH try ... catch!
			} else if(message.type == SC.OutType.ROOM_DATA) {
				//updateClientList()
				console.log("room info");
				console.log(message.payload);
				let packet = JSON.parse(message.payload);
				if(packet.controller.id != id) {
					selector.add(new Option(packet.controller.name, packet.controller.id, false, false));
				}
				for(let i in packet.clients) {
					let client = packet.clients[i];
					console.log(JSON.stringify(client));
					if(client.id != id)
						selector.add(new Option(client.name, client.id, false, false));
				}
				(<any>jQuery('select')).material_select();

			} else if(message.type == SC.OutType.NEW_CLIENT) {
				console.log("adding to select");
				let packet = JSON.parse(message.payload);
				selector.add(new Option(packet.name, packet.id, false, false));
				(<any>jQuery('select')).material_select();
			}
		} else {
			let str = message.source == SC.messageSource.CONTROLLER
							? "\n Controller says: " + message.payload
							: "\n" + message.payload
			messageArea.innerText += str;
		}
	}
}
