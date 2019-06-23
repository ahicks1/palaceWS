# Connecting
* To connect a client connect to `ws:/{serverip}{serverport}/join?name={name}&room={room}`
* To create a room as a controller connect to `ws:/{serverip}{serverport}/start?name={name}`

# Messages
The basic format of messages is as follows:
```{
{
  target:"CONTROLLER",
  type:"DATA",
  tags:[],
  payload:"{"hello"}"
}
```

* target *{string}*: one of ["SERVER"|"CONTROLLER"|"CLIENTS"|
"TARGETED"|"ALL"]

* type *{string}*: The message type (see rest of docs for values)

* tags *{string[]}*: Optional list of strings usually used with TARGETED target to list endpoints

* payload *{string}*: stringified json the schema for which depends on the target and message type

## Server messages

* ### Type: "GET_ROOM"
  returns the room information in the following payload format
  ```{
  {
    id:"2b80c2",
    controller:{
      name:"steve",
      id:"0a928fed"
    },
    clients:[
      {name:"bob",id:"901308e6"},
      {name:"larry",id:"969114af"}
    ]
  }
  ```

  # Development

  ## Generate Documentation
  `npm run mkdocs`
  ## Start Development Server
  `npm start`

