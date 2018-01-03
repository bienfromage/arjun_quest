var username;
var index;
var centerX = 0;
var centerY = 0;
var x = Math.floor(Math.random()*5+500);
var y = Math.floor(Math.random()*5+500);
var velX = 0;
var velY = 0;
var jump = 0;
var jumpVel = 0;
var flip = false;
var health = 100;
var swordTimer = 0;
var swordAngle = 0;


var canvas;
var ctx;
var backgroundOne = new Image();
var avatar = new Image();
var sword = new Image();

var players;
var imageOriginX;
var imageOriginY;

//establish connection to server
const socket = io();

socket.on('setFinalUsername',(name)=>username = name);
socket.on('playerData',(data)=>{
    players = data;
});

document.onkeydown = (e)=>{
	e = e || window.event;
	if(e === 39 || e.keyCode === 39 ||e === 68 || e.keyCode === 68){
		velX=10;
		flip = true;
        swordInitAngle = -244;
        swordY=25;
        swordX=50;
	}else if (e === 37 || e.keyCode === 37||e === 65 || e.keyCode === 65){
		velX= -10;
		flip = false;
        swordInitAngle = -44;
        swordY = 25;
        swordX = 0;
	}else if(e === 40 || e.keyCode === 40||e === 83 || e.keyCode === 83){
		velY = 10;
        swordInitAngle = 244;
        swordY = 50;
        swordX = 25;
	}else if(e === 38 || e.keyCode === 38||e === 87 || e.keyCode === 87){
		velY = -10;
        swordInitAngle = 44;
        swordY = 0;
        swordX = 25;
    }
}
document.onkeyup = (e)=>{
	e = e || window.event;
	if((e === 39 || e.keyCode === 39 ||e === 68 || e.keyCode === 68)&&velX!==-10){
		velX=0;
		jump = 0;
	}else if((e === 37 || e.keyCode === 37||e === 65 || e.keyCode === 65)&&velX!==10){
		velX=0;
		jump = 0;
	}else if((e === 40 || e.keyCode === 40||e === 83 || e.keyCode === 83)&&velY!==-10){
		velY=0;
		jump = 0;
	}else if((e === 38 || e.keyCode === 38||e === 87 || e.keyCode === 87)&&velY!==10){
		velY=0;
		jump = 0;
	}
}

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
        
    //listen for mouse clicks (and then swing sword in direction of mouse)
    canvas.addEventListener("mousedown",(event)=>{
        swordAngle = Math.atan2(event.y-centerY,event.x-centerX)*180/Math.PI+135;
        swordTimer = 5;
    },false);
	
	//set image variables
	backgroundOne.src="background.png";
	avatar.src="Arjun.png";
    sword.src="basic_sword.png";
	
	//determine center of screen
	centerX = canvas.width/2-25;
	centerY = canvas.height/2-25;
	
	setInterval(update, 50);
}

function update(){
	//update position
	x+=velX;
	y+=velY;
	
	if(velX !== 0 || velY !== 0){
		jump+=jumpVel;
		if(jump < -4)
			jumpVel = 2;
		else if(jump > -1)
			jumpVel = -2;
	}
	
	//send updated info to server
    socket.emit('update',{username:username,x:x,y:y+jump,flip:flip, health:health, swordTimer:swordTimer, swordAngle:swordAngle});
	
    //clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);
    
    //draw me
	ctx.drawImage(backgroundOne,centerX-x,centerY-y-jump);
    drawCharacter(username, health, avatar, centerX, centerY, flip, 50, 50);
    if(swordTimer !== 0){
        swordAngle-=18;
        ctx.save();
        ctx.translate(centerX+25, centerY+25);
        ctx.rotate(Math.PI/180*swordAngle);
        ctx.translate(-25,-50);
        ctx.drawImage(sword,0,-25,50,50);
        ctx.restore();
        swordTimer--;
    }
    
    //draw other players
    imageOriginX = centerX-x;
    imageOriginY = centerY-y-jump;
    for(i = 0; i < players.length; i++){
        if(players[i].username !== username){
            drawCharacter(players[i].username, players[i].health, avatar, imageOriginX+players[i].x,imageOriginY+players[i].y,players[i].flip,50,50);
            
            if(players[i].swordTimer !== 0){
                ctx.save();
                ctx.translate(imageOriginX+players[i].x+25,imageOriginY+players[i].y+25);
                ctx.rotate(Math.PI/180*players[i].swordAngle);
                ctx.translate(-25,-50);
                ctx.drawImage(sword,0,-25,50,50);
                ctx.restore();
            }
        }
    }
    
    //draw onscreen data
    ctx.font = "12px pixelated";
    ctx.fillStyle = "white";
    ctx.fillText("USERS ONLINE: "+players.length,10,20);
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