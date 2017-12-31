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

/** Class representing an outbound message */
export class serverMessage {
  target:messageTarget;
  tags:string[]; //Ususally used to list targets
  payload:string;

  /**
   * Create a new serverMessage
   * @param target - a messageTarget representing the destination
   * @param tags - The list of targets by name when targeted
   * @param data - The payload that gets stringified
   */
  constructor(target:messageTarget,tags:string[],data:any){
    this.target = target;
    this.tags = tags;
    this.payload = JSON.stringify(data);

  }

}

/**
 * Formats a packet for a client to send after connecting
 * @param name - The display name for the client
 * @param room - The room for the client to join
 */
export function getClientInitPacket(name:string,room:string): string{
	let clientInfo:any = {
		type:connectionType.CLIENT,
		room:room,
		name:name
	}
  //Empty target
  let ret = new serverMessage(messageTarget.SERVER,[],clientInfo);
  return JSON.stringify(ret);

}

/**
 * Same as getClientInitPacket but for the controller
 * @param name - The display name for the controller
 * @param room - The room for the controller to join
 */
export function getControllerInitPacket(name:string,room:string): string{
	let controllerInfo:any = {
		type:connectionType.CONTROLLER,
		room:room,
		name:name

	}
  let ret = new serverMessage(messageTarget.SERVER,[],controllerInfo);
  return JSON.stringify(ret);

}
