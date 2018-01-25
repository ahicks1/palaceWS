import * as SC from "./socketCore"

/** Enum describing the socket connection status */
export enum connectionStatus {
  DISCONNECTED,
  CONNECTED,
  READY
}

export class ServerConnection {
  /* Public members */
  public messageCallback :(msg:SC.ClientMessage) => void;
  public eventCallback :(msg:SC.ClientMessage) => void;
  public stateChangeCallback :(state:connectionStatus) => void;

  private _name:string;
  name():string {
    return this._name;
  }
  private _room:string;
  room():string {
    return this._room;
  }
  private _id:string;
  id():string {
    return this._id;
  }
  private _ip:string;
  ip():string {
    return this._ip;
  }

  private _controller:SC.ConnInfo;
  controller():SC.ConnInfo {
    return this._controller;
  }

  private _clients:any;
  client(id:string):SC.ConnInfo {
    //Might return undefined
    return this._clients[id];
  }

  private _cType:SC.connectionType;
  cType():SC.connectionType {
    return this._cType;
  }

  private _state:connectionStatus;
  state():connectionStatus {
    return this._state;
  }

  /* Private members */
  ws:WebSocket;


  /* Public functions */
  reconnect() {

  }

  constructor (type:SC.connectionType,
               room:string,
               name:string,
               ip:string) {
    this._ip = ip;
    this._cType = type;
    this._name = name;
    this._room = room;
    this._state = connectionStatus.DISCONNECTED;

    this._clients = {};


    console.log("creating object!")
    this.ws = new WebSocket(ip);
    //this.ws.class = this;
    //Binding overrides the default "this" for the websocket callback
    this._open = this._open.bind(this);
    this.ws.onopen = this._open;

    this._message = this._message.bind(this);
  	this.ws.onmessage = this._message;

    this._close = this._close.bind(this);
    this.ws.onclose = this._close;



  }


  /* Private functions */
  private _updateState(nstate:connectionStatus) {
    if(this._state != nstate) {
      this._state = nstate;
      if(this.stateChangeCallback) {
        this.stateChangeCallback(this._state);
      }
    }
  }

  private _open(){
    let data:any = {
      room:this._room,
      name:this._name,
    };
    data.type = (this._cType == SC.connectionType.CONTROLLER)
                ? SC.serverInTypes.START
                : SC.serverInTypes.JOIN;
    let packet = new SC.ServerMessage(SC.messageTarget.SERVER,[],JSON.stringify(data));
    this._updateState(connectionStatus.CONNECTED);
    console.log(this._name);
    this.ws.send(JSON.stringify(packet));
  }

  private _message(ev:MessageEvent) {
    let message = SC.parseMessage(ev.data);
    if(message) {

      /** Handle server messages and broadcast event as needed */
      if (message.source == SC.messageSource.SERVER) {

        let packet = JSON.parse(message.payload);
        /** Switch based on message type */
        switch(message.type) {
          case SC.OutType.CONNECT_AWK:
            this._id = JSON.parse(message.payload).id;
            this._updateState(connectionStatus.READY);
          case SC.OutType.ROOM_DATA:
            if(this.eventCallback)
              this.eventCallback(message);
            if(packet.controller) {
              this._controller = packet.controller;
            }
            for(let i in packet.clients) {
    					let client = packet.clients[i];
              this._clients[i] = client;
    				}
            //TODO: AJH how to notify end user app?

          case SC.OutType.NEW_CLIENT:
            //TODO: AJH check to see if client already exists?
            this._clients[packet.id] = new SC.ConnInfo(packet.name,packet.id);
        }
      } else {
        if(message.type == SC.OutType.DATA) {
          if(this.messageCallback) {
            this.messageCallback(message)
          } else {
            console.log("Unhandled message!: " + JSON.stringify(message));
          }
        }
      }

    }
  }

  private _close(es:CloseEvent) {
    console.log("Palace connection closed");
    //this._updateState(connectionStatus.DISCONNECTED);
  }

}
