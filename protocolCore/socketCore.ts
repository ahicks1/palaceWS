/** Enum indicating if a connection is a controller or a client */
export enum connectionType {
  CONTROLLER,
  CLIENT,
}

/** Class representing an outbound message */
export class serverMessage {
  targets:string[];
  payload:string;
  /**
   * Create a new serverMessage
   * @param ts - The list of targets by name; blank for init
   * @param data - The payload that gets stringified
   */
  constructor(ts:string[],data:any){
    this.targets = ts;
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
  let ret = new serverMessage([],clientInfo);
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
  let ret = new serverMessage([],controllerInfo);
  return JSON.stringify(ret);

}
