const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var players = [];
var monsters = [];
var items = [];
var isDespawnRunning = false;

const PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;

const server = express()
  .use(express.static(__dirname+'/public'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  //set instance variables
  var username;
  
  socket.on('setUsername',(name)=>{
	  for(a = 0; a < players.length; a++){
		if(players[a].username === name){
			name+="+";
			a = -1;
		}
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
	
	socket.on('hitMonster', (id)=>{
	  for(i = 0; i < monsters.length; i++){
	    if(monsters[i].id === id){
	      monsters[i].damage(2);
	    }
	  }
	});
	
	socket.on('collect', (id)=>{
	  for(i = 0; i < items.length; i++){
	    if(items[i].id === id){
	      killItem(false, i);
	    }
	  }
	});
  
  socket.on('disconnect', () => {
  	for(i = 0; i < players.length; i++){
  	  if(players[i].username === username)
  		  players.splice(i,1);
  	}
  });
});

setInterval(function(){
  //spawn/despawn
  if(monsters.length < players.length*2 && monsters.length < 10){
    var axis = Math.random()
    if(axis<0.5)
      monsters.push(new Enemy(2, Math.floor(Math.random()*1550), 0));
    else
      monsters.push(new Enemy(2, 0, Math.floor(Math.random()*850)));
  }else if(players.length === 0 && monsters.length >0){
    monsters = [];
    items = []
  }
  
  //move monsters
  for(i = 0; i < monsters.length; i++){
    for(j = 0; j < players.length; j++){
      if(players[j].isAlive)
        monsters[i].checkTarget(players[j].x,players[j].y);
    }
    monsters[i].makeMove();
  }
  
	io.emit('serverData',players,monsters,items);
},1000/60);

//enemy object
function Enemy(type, mx, my){
	this.type = type;
	this.username = "MONSTER";
	this.x = mx;
	this.y = my;
	this.velX = 0;
	this.velY = 0;
	this.targetX = -1;
	this.targetY = -1;
	this.hasTarget = false;
	this.battleClock = 0;
	this.jump = 0;
	this.health = 100;
	this.goalHealth = 100;
	this.totalHealth = 100;
	this.flip = false;
	this.id = Math.random();
	this.despawn = false;
	
	this.start = function(){
	  switch(type){
	    case 2://set up for troll
	      var nameChance = Math.random();
	      if(nameChance > 0.5)
	        this.username = "GLOG";
	      else
	        this.username = "SPLUNK";
	      //set health
	      this.goalHealth = 30;
	      this.health = 30;
	      this.totalHealth = 30;
	    break;
	  }
	};
	this.start();
	
	this.checkTarget = function(playerX, playerY){
		if(Math.abs(playerX-this.x)<300 && Math.abs(playerY-this.y)<300){
			if(!this.hasTarget || (Math.abs(playerX-this.x)>Math.abs(this.targetX-this.x) && Math.abs(playerY-this.y)>Math.abs(playerY-this.targetY))){
				this.targetX = playerX;
				this.targetY = playerY;
				this.hasTarget = true;
			}
		}
	};
	
	this.makeMove = function(){
	  var velX = 0;
		var velY = 0;
		this.jump = 0;
		if(this.hasTarget){
		  if(this.x-this.targetX>0 && Math.abs(this.x-this.targetX)>5){
		    velX = -2;
		  }else if(this.x-this.targetX<0 && Math.abs(this.x-this.targetX)>5){
		    velX = 2;
		  }
		    
		  if(this.y-this.targetY>0 && Math.abs(this.y-this.targetY)>5){
		    velY = -2;
		  }else if(this.y-this.targetY<0 && Math.abs(this.y-this.targetY)>5){
		    velY = 2;
		  }
		}else if(this.battleClock%60 === 0){
		  var move = Math.ceil(Math.random()*5);
		  if(move===1)
		    velX=1;
		  else if(move === 2)
		    velX=-1;
		  else if(move === 3)
		    velY = 1;
		  else if(move === 4)
		    velY = -1;
		}else{
		  velX = this.velX;
		  velY = this.velY;
		}
		this.velX = velX;
		this.velY = velY;
		
		if(this.velX !== 0 || this.velY !== 0){
      this.jump = this.battleClock%20;
		}
		if(this.jump > 10)
		  this.jump = 20-this.jump;
		
		this.hasTarget = false;
		
		//update variables
	  this.x += this.velX;
	  this.y += this.velY;
	  //correct enemy out of bounds
	  if(this.x<-50)
		  this.x=1600;
		else if(this.x > 1650)
		  this.x = 0;
		
		//wrap screen,
		//if too many monsters are present, despawn instead of wrapping
		if(this.y<-50){
		  this.y=900;
		  if(monsters.length > players.length*2){
		    for(i=0;i<monsters.length;i++){
		      if(monsters[i].id == this.id)
		        monsters.splice(i,1);
		    }
		  }
		}else if(this.y > 950){
		  this.y =-50;
		  for(i=0;i<monsters.length;i++){
		      if(monsters[i].id == this.id)
		        monsters.splice(i,1);
		    }
		}
	    
	  if(this.velX>0)
	    this.flip = false;
	  else if(this.velX < 0)
	    this.flip = true;
	  
	  if(this.battleClock<100)
	     this.battleClock++;
	  else
	    this.battleClock = 0;
	    
	  if(this.velX>0)
	    this.flip = false;
	  else if(this.velX < 0)
	    this.flip = true;
	    
	  if(this.health > this.goalHealth)
	    this.health--;
	    
	  if(this.health < 0){
	    items.push({type:"coin",x:this.x,y:this.y,id:Math.random()});
	    killItem(true,this.id);
	  }
	};
	
	this.damage = function(damage){
	  this.goalHealth -= damage;
	};
	
	this.draw =function(){
		//function drawCharacter(charName, charHealth, charImage, charX, charY, charFlip, charWidth, charHeight)
		drawCharacter(this.username,Math.ceil(this.health/this.totalHealth*100),imgs[this.type],imageOriginX+this.x,imageOriginY+this.y-this.jump,this.flip,50,50);
	};
}

function killItem(isMonster, index){
  if(isMonster){
    for(i = 0; i < monsters.length; i++){
      if(monsters[i].id === index){
        monsters.splice(i,1);
      }
    }
  }else{
    items.splice(index,1);
  }
}