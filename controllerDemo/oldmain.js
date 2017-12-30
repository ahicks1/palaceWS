//vars hold whether or not that thing became true
var joinYes;
document.getElementById("join_button").addEventListener("click", joinVal);
function joinVal(){
  alert("Joining");
  joinYes = true;
}

var apprYes;
document.getElementById("approve_button").addEventListener("click", appVal);
function appVal(){
	alert("Approve");
  apprYes = true;
}

var rejYes;
document.getElementById("reject_button").addEventListener("click", rejVal);
function rejVal(){
	alert("Reject");
  rejYes = true;
}

var passYes;
document.getElementById("pass_button").addEventListener("click", passVal);
function passVal(){
	alert("Pass");
  passYes = true;
}

var failYes;
document.getElementById("fail_button").addEventListener("click", failVal);
function failVal(){
	alert("Fail");
  failYes = true;
}

var websocket = new WebSocket("ws://localhost:8080"); //NOTE: change this later to be any IP
websocket.onopen = yesConnect;
function yesConnect(){
	websocket.send(getStartPacket());
}

InboundUserT = {
  JOIN:1,
  REQ_STATE:2,
  ACT_VOTE:3,
  ACT_QUEST:4,
  CHOOSE_PLAYERS:5,
}
function getStartPacket(){
  var ret = {
    type:InboundUserT.JOIN,
    name:"UnderLord"
  }
  return JSON.stringify(ret);
}
