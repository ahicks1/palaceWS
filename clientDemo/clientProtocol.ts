import * as SC from "../protocolCore/socketCore"

function joinClicked(event:Event) {
	console.log("join pressed");
	websocket = new WebSocket("ws://localhost:8080"); //NOTE: change this later to be any IP
	websocket.onopen = yesConnect;
}
document.getElementById('join_button').onclick = joinClicked;
var websocket:WebSocket;//
var room;
var username;
function yesConnect(): void{
	username = (<HTMLInputElement> document.getElementById('username_field')).value;
	room = (<HTMLInputElement> document.getElementById('room_field')).value;
	websocket.send(SC.getClientInitPacket(username,room)); 
}
