var isAlive = true;
var index;
var centerX = 0;
var centerY = 0;
var x = Math.floor(Math.random()*1550);
var y = Math.floor(Math.random()*880);
var velX = 0;
var velY = 0;
var jump = 0;
var jumpVel = 0;
var flip = false;
var health = 100;
var goalHealth = 100;
var swordTimer = 0;
var swordAngle = 0;
var swordInitAngle = 0;
var velLock = 0;
var velLockX = 0;
var velLockY = 0;
var coins = 0;

var canvas;
var ctx;
var imgs = [];
var backgroundOne = new Image();
var avatar = new Image();
var sword = new Image();

var players = [];
var monsters = [];
var items = [];
var animationTimer = 0;
var imageOriginX;
var imageOriginY;

//establish connection to server
const socket = io();

socket.on('setFinalUsername',(name)=>username = name);
socket.on('serverData',(data, monsterData, itemData)=>{
    players = data;
    monsters = monsterData;
    items = itemData;
});

socket.on('hit', (name)=>{
	if(username === name){
		goalHealth-=2;
		if(goalHealth < 1){
			dieGloriously();
		}
	}
});

document.onkeydown = (e)=>{
	e = e || window.event;
	if(velLock === 0){
  	if(e === 39 || e.keyCode === 39 ||e === 68 || e.keyCode === 68){
  		velX=4;
  		flip = true;
          swordX=50;
  	}else if (e === 37 || e.keyCode === 37||e === 65 || e.keyCode === 65){
  		velX= -4;
  		flip = false;
  	}else if(e === 40 || e.keyCode === 40||e === 83 || e.keyCode === 83){
  		velY = 4;
  	}else if((e === 38 || e.keyCode === 38||e === 87 || e.keyCode === 87)&&velY!==10){
  		velY=-4;
  	}
	}
};
document.onkeyup = (e)=>{
	e = e || window.event;
	if(velLock === 0){
  	if((e === 39 || e.keyCode === 39 ||e === 68 || e.keyCode === 68)&&velX!==-4){
  		velX=0;
  		jump = 0;
  	}else if((e === 37 || e.keyCode === 37||e === 65 || e.keyCode === 65)&&velX!==4){
  		velX=0;
  		jump = 0;
  	}else if((e === 40 || e.keyCode === 40||e === 83 || e.keyCode === 83)&&velY!==-4){
  		velY=0;
  		jump = 0;
  	}else if((e === 38 || e.keyCode === 38||e === 87 || e.keyCode === 87)&&velY!==4){
  		velY=0;
  		jump = 0;
  	}
	}
};

function start(){
	
	//set username
	username = document.getElementById('inBox').value.toUpperCase();
	if(!username)
		username = "ANON";
	
	//change styling to accommodate canvas
    document.getElementById('main').innerHTML = "<canvas id = 'canvas'>Well that's awkward -- your browser doesn't support this element.</canvas>";
	document.getElementsByTagName('style')[0].innerHTML ="* { margin:0; padding:0; } html, body { width:100%; height:100%; text-align: center;}canvas { display:block;padding: 0;margin: auto;position: absolute;top: 0;bottom: 0; left: 0;right: 0;} body{background-color: black;}img{display: none;}@font-face{font-family:pixelated;src:url(Pixeled.ttf);font-style:normal;font-weight:normal;}";

	
	//Pass username to server. In the server code, the username will be used to establish the index of this player's object in the "players" array.
	socket.emit('setUsername',username);
	
	//set up canvas
	canvas = document.getElementById('canvas');
	canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
	ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
        
    //listen for mouse clicks
    canvas.addEventListener("mousedown",(event)=>{
		if(isAlive){//sword
			swordInitAngle = Math.atan2(event.y-(centerY+25),event.x-(centerX+25))*180/Math.PI+180;
        	swordAngle = swordInitAngle-67;
			swordTimer = 11;
		}else{//respawn button
			if(event.x>centerX-15 && event.x<centerX+65 && event.y>centerY+5 && event.y<centerY+45){
				health = 100;
				goalHealth = 100;
				isAlive = true;
				x = Math.floor(Math.random()*1550);
				y = Math.floor(Math.random()*880);
			}
		}
    },false);
	
	for(i = 0; i < 4; i++){
	  imgs.push(new Image());
	}
	
	imgs[0].src="Arjun.png";
	imgs[1].src="Antonia.gif";
	imgs[2].src="troll.gif";
	imgs[3].src="coinmation.png";
	
	//set image variables
	backgroundOne.src="background.png";
	avatar.src=imgs[avatarToUse];
    sword.src="basic_sword.png";
	
	//determine center of screen
	centerX = canvas.width/2-25;
	centerY = canvas.height/2-25;
	
	//start clock
	interval = setInterval(update, 1000/50);
}

function update(){

  //clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	//update position
	if(isAlive){
	  if(velLock===0){
		  x+=velX;
		  y+=velY;
		}else{
		  velLock--;
		  x+=velLockX;
		  y+=velLockY;
		}
		
		if(x<-50)
		  x=1600;
		else if(x > 1650)
		  x = 0;
		  
		if(y<-50)
		  y=900;
		else if(y > 950)
		  y =-50;
		

		if(velX !== 0 || velY !== 0){
			jump+=jumpVel;
			if(jump < -8)
				jumpVel = 1;
			else if(jump > -1)
				jumpVel = -1;
		}
	}

	//update health bar - this will make the health bar appear to shrink smoothly
	if(goalHealth !== health){
		health--;
	}
	
	//clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	//draw background
	ctx.drawImage(backgroundOne,centerX-x,centerY-y-jump);
	
	//actions to perform if alive
	if(isAlive){
		//draw me
		drawCharacter(username, health, imgs[avatarToUse], centerX, centerY, flip, 50, 50);
		if(swordTimer !== 0){
			swordAngle-=4;
			ctx.save();
			ctx.translate(centerX+25, centerY+25);
			ctx.rotate(Math.PI/180*swordAngle);
			ctx.translate(-25,-50);
			ctx.drawImage(sword,0,-25,50,50);
			ctx.restore();
			swordTimer--;
		}
	}else{//actions to perform if dead
		ctx.font="20px pixelated";
		ctx.fillStyle="white";
		ctx.fillText("YOU CEASED TO LIVE", centerX-120, centerY-10);
		ctx.fillRect(centerX-15,centerY+5,80,40);
		ctx.fillStyle="black";
		ctx.font="10px pixelated";
		ctx.fillText("RESPAWN", centerX-10,centerY+30);
	}
		
	//send updated info to server
	socket.emit('update',{username:username, avatar:avatarToUse,x:x,y:y+jump,flip:flip, health:health, coins:coins, swordTimer:swordTimer, swordAngle:swordAngle, width:50,height:50,isAlive:isAlive});
    
    //draw other players
    imageOriginX = centerX-x;
    imageOriginY = centerY-y-jump;
	  var swordCos = x-Math.cos(swordInitAngle*Math.PI/180)*50;
	  var swordSin = y-Math.sin(swordInitAngle*Math.PI/180)*50;
	  
    for(i = 0; i < players.length; i++){
        if(players[i].username !== username && players[i].isAlive){
            drawCharacter(players[i].username, players[i].health, imgs[players[i].avatar], imageOriginX+players[i].x,imageOriginY+players[i].y,players[i].flip,50,50);
            
            if(players[i].swordTimer !== 0){
                ctx.save();
                ctx.translate(imageOriginX+players[i].x+25,imageOriginY+players[i].y+25);
                ctx.rotate(Math.PI/180*players[i].swordAngle);
                ctx.translate(-25,-50);
                ctx.drawImage(sword,0,-25,50,50);
                ctx.restore();
            }
			
      			//check - did I stab any players
      			if(swordTimer !== 0 && isAlive){
      				if(players[i].x<swordCos+50 && players[i].x+50>swordCos && players[i].y<swordSin+50 && players[i].y+50>swordSin){
      				   socket.emit("hit",players[i].username);
      				}
      			}
        }
    }
	  
	  //draw monsters
	  for(i=0; i < monsters.length; i++){
	    drawCharacter(monsters[i].username,Math.ceil(monsters[i].health/monsters[i].totalHealth*100),imgs[monsters[i].type],imageOriginX+monsters[i].x,imageOriginY+monsters[i].y-monsters[i].jump,monsters[i].flip,50,50);
	    
	    //check - did I stab any monsters
	    if(isAlive){
  	    if(swordTimer !== 0){
  				if(monsters[i].x<swordCos+50 && monsters[i].x+50>swordCos && monsters[i].y<swordSin+50 && monsters[i].y+50>swordSin){
  				   socket.emit("hitMonster",monsters[i].id);
  				}
  			}
				//for that matter, was I stabbed BY any monsters
				if(monsters[i].x<x+30 && monsters[i].x+30>x && monsters[i].y<y+30 && monsters[i].y+30>y){
				  goalHealth -= 15;
				  velLockX = monsters[i].velX*3;
				  velLockY = monsters[i].velY*3;
				  velLock = 10;
				  if(goalHealth < 1){
      			dieGloriously();
      		}
				}
	    }
	  }
	  
	  //draw pick-ups
	  for(i = 0; i < items.length; i++){
	    ctx.drawImage(imgs[3],0,0,100,100,imageOriginX+items[i].x,imageOriginY+items[i].y,50,50);
	    //did I find a collectable
	    if(isAlive && items[i].x<x+30 && items[i].x+30>x && items[i].y<y+30 && items[i].y+30>y){
	      socket.emit("collect",items[i].id);
	      coins++;
	    }
	  }
	  
    //draw onscreen data
    ctx.font = "12px pixelated";
    ctx.fillStyle = "white";
    ctx.fillText("HEROES ONLINE: "+players.length,10,20);
    
    players.sort(function(a,b){return b.coins-a.coins});
    ctx.fillText("LEADERBOARD",canvas.width-160,40);
    var boardY = 60;
    var boardLength = 0;
    if(players.length<5)
      boardLength = players.length;
    else
      boardLength = 5;
    for(i = 0; i < boardLength; i++){
      ctx.fillText(players[i].username+" "+players[i].coins, canvas.width-160,boardY);
      boardY+=20;
    }
}

//flip images
function flipIt(img, imgX, imgY, width, height){
	//save current context before applying transformations
	ctx.save();
	
	//set the origin to the center of the image
	ctx.translate(imgX+width/2, imgY+height/2);
	
	//flip the canvas
	ctx.scale(-1,1);
	
	//draw the image
	ctx.drawImage(img, -width/2, -height/2, width, height);
	//restore the canvas
	ctx.restore();
}

//draw a character
function drawCharacter(charName, charHealth, charImage, charX, charY, charFlip, charWidth, charHeight){
    if(charFlip)
        flipIt(charImage, charX, charY, charWidth, charHeight);
    else
        ctx.drawImage(charImage, charX, charY, charWidth, charHeight);
    ctx.fillStyle="white";
    ctx.font = "10px pixelated";
    ctx.fillText(charName, charX, charY-10);
    ctx.fillStyle="red";
    ctx.fillRect(charX,charY-5,charHealth/2,5);
}

//death code
function dieGloriously(){
  isAlive = false;
  coins = 0;
  velLock = 0;
  velX=0;
  velY=0;
}