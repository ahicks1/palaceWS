import * as SC from "../protocolCore/socketCore"

document.getElementById('join_button').onclick = joinClicked;
function joinClicked(event:Event) {
	console.log("join pressed");
  let ip = window.location.hostname;//(<HTMLInputElement> document.getElementById('ip_field')).value;
  //if(ip == "") ip = window.location.hostname;
	websocket = new WebSocket("ws://"+ip+":8080"); //NOTE: change this later to be any IP
	websocket.onopen = yesConnect;
	websocket.onmessage = messageHandler;
}

document.getElementById('send_button').onclick = messageClicked;
function messageClicked(event:Event) {
	let selector = (<HTMLSelectElement> document.getElementById('target'));
	let targets = [];
	for(let i = 0; i < selector.selectedOptions.length; i++) {
		console.log(selector.selectedOptions[i].text);
		targets.push(selector.selectedOptions[i].text);

	}
	let message = (<HTMLInputElement> document.getElementById('message_field')).value;
	if(targets.lastIndexOf("All") != -1){
		console.log("broadcasting to all");
		websocket.send(SC.getPacketAll(message));
	} else {
		websocket.send(SC.getPacket(message,targets));
	}
	//targets.add(new Option("text", "value", false, false));
	//(<any>$('select')).material_select();



}

let messageArea = document.getElementById('messages');


var websocket:WebSocket;
var room;
var username;
function yesConnect(): void{
	username = (<HTMLInputElement> document.getElementById('username_field')).value;
	room = (<HTMLInputElement> document.getElementById('room_field')).value;
  if((<HTMLInputElement> document.getElementById('controller_field')).checked == true) {
   console.log("ischecked")
	 websocket.send(SC.getControllerInitPacket(username,room));
 } else {
   websocket.send(SC.getClientInitPacket(username,room));
 }

}

function messageHandler(this:WebSocket,ev:MessageEvent):any {
	messageArea.innerText += "\n" + ev.data
}
