/** Enum indicating if a connection is a controller or a client */
export enum connectionType {
  CONTROLLER,
  CLIENT,
}

export enum messageTarget {
  ALL, //Broadcast to all other connections including controller
  CONTROLLER, //Sent to the controller
  TARGETED, //Sent to every name listed in targets
  SERVER //Sent to the server
}

export enum messageSource {
  SERVER,
  CONTROLLER,
  CLIENT
}

/** Types a message targeting the server can have */
export enum serverInTypes {
  START, //Start a server as controller DONE
  JOIN, //Join as client DONE
  GET_CLIENTS, //List of all clients in room TODO
  CONFIGURE //Set room settings TODO

}

/** Types a message coming from the server can have */
export enum OutType {
  DATA,
  CONNECT_AWK, //Contains the server assigned id of the connection DONE
  NEW_CLIENT, //New cliend joined the room DONE
  LOST_CLIENT, //Client disconnected from the room TODO
  ROOM_DATA, // DONE
  CONFIGURATION //Room configuration object TODO

}

export class ConnInfo {
  //room:string;
  name:string;
  id:string;

  constructor(name:string,id:string) {
    //this.room = room;
    this.name = name;
    this.id = id;
  }
}

export class RoomData {
  name:string;
  controller:ConnInfo;
  clients:any;
}




/** Class representing an outbound message */
export class ServerMessage {
  target:messageTarget;
  tags:string[]; //Ususally used to list targets
  payload:string;

  /**
   * Create a new ServerMessage
   * @param target - a messageTarget representing the destination
   * @param tags - The list of targets by name when targeted
   * @param data - The payload as a string
   */
  constructor(target:messageTarget,tags:string[],data:string){
    this.target = target;
    this.tags = tags;
    this.payload = data;
  }
}

/** Class representing an inbound message */
export class ClientMessage {
  source:messageSource;
  type:OutType;
  payload:string;

  /**
   * Create a new ClientMessage
   * @param source - a messageSource representing the source
   * @param data - The payload as a string
   */
  constructor(source:messageSource,type:OutType,data:string){
    this.source = source;
    this.type = type;
    this.payload = data;
  }
}

/**
 * Parses a message from string(returns undefined if unable to parse)
 * @param src - The source string to be converted
 */
export function parseMessage(src:string):ClientMessage {
  let ret:ClientMessage;
  try{
    let obj = JSON.parse(src);

    if( obj.source != undefined &&
        obj.payload != undefined &&
        obj.type != undefined) {
      ret = new ClientMessage(obj.source,obj.type,obj.payload);
    }
  }
  catch(e) {
    return undefined;
  }
  return ret;

}

/**
 * Formats a packet for a client to send after connecting
 * @param name - The display name for the client
 * @param room - The room for the client to join
 */
export function getClientInitPacket(name:string,room:string): string{
	let clientInfo:any = {
		type:serverInTypes.JOIN,
		room:room,
		name:name
	}
  //Empty target
  let ret = new ServerMessage(messageTarget.SERVER,[],JSON.stringify(clientInfo));
  return JSON.stringify(ret);

}

/**
 * Same as getClientInitPacket but for the controller
 * @param name - The display name for the controller
 * @param room - The room for the controller to join
 */
export function getControllerInitPacket(name:string,room:string): string{
	let controllerInfo:any = {
    type:serverInTypes.START,
		room:room,
		name:name

	}
  let ret = new ServerMessage(messageTarget.SERVER,[],JSON.stringify(controllerInfo));
  return JSON.stringify(ret);

}



/**
 * Gets a packet set to broadcast to every open connection in the room
 * @param payload - The data to broadcast
 */
export function getPacketAll(payload:string): string {
  let ret = new ServerMessage(messageTarget.ALL,[],payload);
  return JSON.stringify(ret);
}

/**
 * Gets a packet to send to the provided targets
 * @param payload - The data to broadcast
 * @param targets - A list of strings naming connections to target
 */
export function getPacket(payload:string,targets:string[]): string {
  let ret = new ServerMessage(messageTarget.TARGETED,targets,payload);
  return JSON.stringify(ret);
}

/**
 * Gets a packet to send to the provided targets
 * @param payload - The data to broadcast
 * @param targets - A list of strings naming connections to target
 */
export function getPacketController(payload:string,): string {
  let ret = new ServerMessage(messageTarget.CONTROLLER,[],payload);
  return JSON.stringify(ret);
}
