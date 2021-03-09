function $(x){return document.getElementById(x)}
var ws;

function connect(pw) {
	ws = new WebSocket("ws://127.0.0.1:8888/admpan");
	ws.onopen=(function (pw) {
		return function() {
			this.send('{"type":"password","value":"'+pw+'"}');
		}
	})(pw);
	ws.onmessage=function(e) {
		var data = JSON.parse(e.data);
		switch (data.type) {
			case "accepted":
				$("panel").style.display="block";
				$("connection").style.display="none";
				break;
			case "connected":
				var user = document.createElement("div");
				user.className="user";
				var img = document.createElement("img");
				img.src = "../graphics/avatars/avatar"+data.avatar+".png";
				user.appendChild(img);
				var div;
				div = document.createElement("div");
				div.className="name";
				div.innerHTML="Name: <b>"+data.name+"</b>"
				user.appendChild(div);
				
				div = document.createElement("div");
				div.className="room";
				div.innerHTML="Room: <b>"+data.room+"</b>"
				user.appendChild(div);
				
				div = document.createElement("div");
				div.innerHTML="IP: <b>"+data.ip+"</b>"
				div.className="ip";
				user.appendChild(div);

				var button = document.createElement("button");
				button.onclick=function() { kick(this.parentNode.getElementsByTagName('b')[0].innerHTML) }
				button.innerHTML = "Kick";
				user.appendChild(button);
				
				button = document.createElement("button");
				button.onclick=function() { kick(this.parentNode.getElementsByTagName('b')[2].innerHTML) }
				button.innerHTML = "Ban IP";
				user.appendChild(button);
				
				$("userslist").appendChild(user);
				break;
			case "disconnected":
				break;
		}
	}
}

function announce(message) {
	ws.send('{"type":"announcement","message":"'+message+'"}');
}

function kick(name) {
	ws.send('{"type":"kick","name":"'+name+'"}');
}

function ban(ip) {
	ws.send('{"type":"ban","ip":"'+ip+'"}');
}