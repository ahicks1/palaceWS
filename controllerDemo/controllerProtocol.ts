import * as SC from "../protocolCore/socketCore"

document.getElementById('join_button').onclick = joinClicked;
function joinClicked(event:Event) {
	console.log("join pressed");
  let ip = (<HTMLInputElement> document.getElementById('ip_field')).value;
  if(ip == "") ip = "localhost";
	websocket = new WebSocket("ws://"+ip+":8080"); //NOTE: change this later to be any IP
	websocket.onopen = yesConnect;
	websocket.onmessage = messageHandler;
}

document.getElementById('send_button').onclick = messageClicked;
function messageClicked(event:Event) {
	let message = (<HTMLInputElement> document.getElementById('message_field')).value;
	websocket.send(SC.getPacketAll(message));
}

let messageArea = document.getElementById('messages');


var websocket:WebSocket;//
var room;
var username;
function yesConnect(): void{
	username = (<HTMLInputElement> document.getElementById('username_field')).value;
	room = (<HTMLInputElement> document.getElementById('room_field')).value;

	websocket.send(SC.getControllerInitPacket(username,room));
}

function messageHandler(this:WebSocket,ev:MessageEvent):any {
	console.log(ev.data);
}
