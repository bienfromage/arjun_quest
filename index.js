const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var users = 0;
var players = [];

const PORT = process.env.PORT || 3000;

const server = express()
  .use(express.static(__dirname+'/public'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  //set instance variables
  var username;
  users++;
  
  socket.on('setUsername',(name)=>{
	  for(a = 0; a < players.length; a++){
		  if(players[a].username === name)
			  name+="+";
	  }
	  players.push({username: name});
	  username = name;
      socket.emit('setFinalUsername', username);
  });
  
  socket.on('update', (data)=>{
	  for(i = 0; i < players.length; i++){
		  if(players[i].username === username)
			  players[i] = data;
	  }
  });

	socket.on('hit',(user)=>{
		io.emit('hit', user);
	});
  
  socket.on('disconnect', () => {
	users--;
	for(i = 0; i < players.length; i++){
	  if(players[i].username === username)
		  players.splice(i,1);
	}
  });
});

setInterval(function(){
	io.emit('playerData',players);
},50);