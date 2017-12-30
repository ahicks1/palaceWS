

export enum connectionType {
  CONTROLLER,
  CLIENT,

}

export class serverMessage {
  targets:string[];
  payload:string;
  constructor(ts:string[],data:Object){
    this.targets = ts;
    this.payload = JSON.stringify(data);

  }

}

export function getClientInitPacket(name:string,room:string): string{
	let clientInfo:any = {
		type:connectionType.CLIENT,
		room:room,
		name:name

	}
  let ret = new serverMessage([],clientInfo);
  return JSON.stringify(ret);

}

export function getControllerInitPacket(name:string,room:string): string{
	let controllerInfo:any = {
		type:connectionType.CONTROLLER,
		room:room,
		name:name

	}
  let ret = new serverMessage([],controllerInfo);
  return JSON.stringify(ret);

}

/*export function getServerMessage(targets:string[],data:Object): serverMessage {
  let msg = new serverMessage();
  return msg;
}*/
