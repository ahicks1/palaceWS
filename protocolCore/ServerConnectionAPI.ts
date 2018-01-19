import * as SC from "./socketCore"

/** Enum describing the socket connection status */
export enum connectionStatus {
  DISCONNECTED,
  CONNECTED,
  READY
}

export class ServerConnection {
  /* Public members */
  private _name:string;
  get name():string {
    return this._name;
  }
  private _room:string;
  get room():string {
    return this._room;
  }
  private _ip:string;
  get ip():string {
    return this._ip;
  }

  private _cType:SC.connectionType;
  get cType():SC.connectionType {
    return this._cType;
  }

  /* Private members */
  private ws:WebSocket;


  /* Public functions */
  constructor (type:SC.connectionType,
               room:string,
               name:string,
               ip:string) {
    this._ip = ip;
    this._cType = type;
    this._name = name;
    this._room = room;

    let packet:any = {
      room:room,
      name:name,
    };
    packet.type = (type == SC.connectionType.CONTROLLER)
                ? SC.serverInTypes.START
                : SC.serverInTypes.JOIN;

  }


  /* Private functions */

}
