// you need to add permissions here REQUEST_URL, separated by , the ip of the server where you request the chat app
REQUEST_URL = ["http://127.0.0.1"];

var WebSocketServer = require('websocket').server;
var http = require('http');

function User() { }

function Room() {
	this.users = [];
}

function Chat() {
	this.users = [];
	this.rooms = [];

	var server = http.createServer(function (request, response) {
		response.writeHead(200, { 'Content-Type': 'text/plain' });
		response.end('AvatarChat 2D 1.0\n');
	});
	server.listen(8888);

	this.ws = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false
	});
	this.ws.parent = this;
	this.ws.on("request", Chat.onRequest);
}

Chat.onRequest = function (request) {
	var allowed = false;
	for (var i = 0; i < REQUEST_URL.length; i++)
		if (REQUEST_URL[i] == request.origin) allowed = true;
	allowed = true;

	if (allowed) {
		chat = this.parent;
		var user = new User();
		user.ws = request.accept(0, request.origin);
		console.log(request.origin);
		user.ws.parent = user;

		var resource = request.resource.substr(1);
		if (resource == "") {
			user.ws.on("message", Chat.onMessage);
			user.ws.on("close", Chat.onClose);
		} else {
			var ressub = resource.substr(0, 9);
			if (ressub == "admpan") {
				user.ws.on("message", Admin.onMessage);
				user.ws.on("close", Admin.onClose);
			} else if (ressub == "listrooms") {
				var arr = [];
				var number = resource.substr(9);
				for (var i = 0; i < number; i++) {
					var room = chat.rooms[i];
					if (room) {
						arr[i] = room.users.length;
					} else arr[i] = 0;
				}
				user.ws.send(JSON.stringify(arr));
				user.ws.close();
			}
		}
	} else request.reject();
}

Admin = {};
Admin.banlist = [];
Admin.PASSWORD = "faraday";
Admin.onMessage = function (message) {
	var data = JSON.parse(message.utf8Data);
	switch (data.type) {
		case "password":
			if (data.value == Admin.PASSWORD) {
				this.send('{"type":"accepted"}');
				for (var i = 0; i < chat.users.length; i++) {
					var user = chat.users[i];
					this.send('{"type":"connected","name":"' + user.name + '","avatar":' + user.avatar + ',"room":' + user.room + ',"ip":"' + user.ws.remoteAddress + '"}');
				}
			} else this.close();
			break;
		case "announcement":
			for (var i = 0; i < chat.users.length; i++)
				chat.users[i].ws.send(message.utf8Data)
			break;
		case "kick":
			for (var i = 0; i < chat.users.length; i++)
				if (chat.users[i].name == data.name)
					chat.users[i].ws.close();
			break;
		case "ban":
			break;
	}
}
Admin.onClose = function () {

}

Chat.onMessage = function (message) {
	var obj;
	try {
		if (message.type == "utf8") {
			console.log(message.utf8Data);
			obj = JSON.parse(message.utf8Data);
		}
	} catch (e) {
		console.log("ALERT!");
	};
	if (!obj) return;
	switch (obj.type) {
		case "exitPrivate":
			var user = this.parent;

			var room = chat.rooms[user.room];
			for (var i = 0; i < room.users.length; i++)
				if (room.users[i].name != user.name)
					room.users[i].ws.send('{"type":"isNotPrivate","name":"' + user.name + '"}');

			if (user.private) {
				user.private.users.splice(user.private.users.indexOf(user), 1);
				for (var i = 0; i < user.private.users.length; i++)
					user.private.users[i].ws.send(JSON.stringify({
						type: "exitPrivate",
						name: user.name
					}));
				user.private = 0;
			}
			break;
		case "accept":
			var user = this.parent;

			var room = chat.rooms[user.room];
			for (var i = 0; i < room.users.length; i++)
				if (room.users[i].name != user.name)
					room.users[i].ws.send('{"type":"isPrivate","name":"' + user.name + '"}');
			var from = 0;
			for (var i = 0; i < chat.users.length; i++)
				if (chat.users[i].name == obj.name) from = chat.users[i];
			if (from) {
				user.px = user.x;
				user.py = user.y;
				if (from.private)
					user.private = from.private;
				else {
					from.px = from.x;
					from.py = from.y;
					user.private = from.private = new Room();
					user.private.users.push(from);
					var room = chat.rooms[from.room];
					for (var i = 0; i < room.users.length; i++)
						room.users[i].ws.send('{"type":"isPrivate","name":"' + from.name + '"}');
				}
				user.private.users.push(user);
				for (var i = 0; i < user.private.users.length; i++)
					if (user.private.users[i].name != user.name) {
						var cuser = user.private.users[i];
						cuser.ws.send(JSON.stringify({
							type: "accept",
							name: user.name,
							avatar: user.avatar,
							status: user.status,
							px: user.px,
							py: user.py
						}));
						user.ws.send(JSON.stringify({
							type: "accept",
							name: cuser.name,
							avatar: cuser.avatar,
							status: cuser.status,
							px: cuser.px,
							py: cuser.py
						}));
					}
			} else user.ws.send('{"type":"privateCancel"}');
			break;
		case "connect":
			var user = this.parent;
			if (!user.isConnected) {
				user.name = obj.name;
				user.avatar = obj.avatar;
				user.room = obj.room;
				user.x = obj.x;
				user.y = obj.y;
				user.status = obj.status;
				var notExists = 1;
				for (var i = 0; i < chat.users.length && notExists; i++)
					if (chat.users[i].name == user.name) notExists = 0;
				if (notExists == 0) {
					this.send('{"type":"alreadyUsed","name":0}');
					this.close();
				} else {
					if (!chat.rooms[user.room])
						chat.rooms[user.room] = new Room();
					chat.rooms[user.room].users.push(user);
					chat.users.push(user);
					var room = chat.rooms[user.room];
					for (var i = 0; i < room.users.length; i++)
						if (room.users[i].name != user.name) {
							var cuser = room.users[i];
							var bIsPrivate = cuser.private ? true : false;
							var obj = {
								type: "connect",
								name: cuser.name,
								avatar: cuser.avatar,
								room: cuser.room,
								status: cuser.status,
								x: cuser.x,
								y: cuser.y,
								isPrivate: bIsPrivate
							}
							cuser.ws.send(message.utf8Data);
							user.ws.send(JSON.stringify(obj));
						}
					user.isConnected = 1;
				}
			}
			break;
		case "privateMessage":
			var user = this.parent;
			if (user.name == obj.name && obj.message) {
				if (user.private) {
					for (var i = 0; i < user.private.users.length; i++)
						if (user.private.users[i].name != user.name)
							user.private.users[i].ws.send(message.utf8Data);
				}
			}
			break;
		case "invite":
			if (obj.from == this.parent.name && obj.name != undefined) {
				var user = 0;
				for (var i = 0; i < chat.users.length; i++)
					if (chat.users[i].name == obj.name) user = chat.users[i];
				if (user)
					user.ws.send(message.utf8Data);
			}
			break;
		case "changeRoom":
			var user = this.parent;
			if (user.name == obj.name) {
				var oldRoom = chat.rooms[user.room];
				oldRoom.users.splice(oldRoom.users.indexOf(user), 1);
				for (var i = 0; i < oldRoom.users.length; i++)
					oldRoom.users[i].ws.send(JSON.stringify({
						type: "leave",
						name: user.name
					}));

				user.room = obj.room;
				if (!chat.rooms[user.room]) chat.rooms[user.room] = new Room();
				var room = chat.rooms[user.room];
				room.users.push(user);
				for (var i = 0; i < room.users.length; i++)
					if (room.users[i].name != user.name) {
						var cuser = room.users[i];
						var bIsPrivate = user.private ? true : false;
						cuser.ws.send(JSON.stringify({
							type: "connect",
							name: user.name,
							avatar: user.avatar,
							room: user.room,
							status: user.status,
							x: user.x,
							y: user.y,
							isPrivate: bIsPrivate
						}));
						bIsPrivate = cuser.private ? true : false;
						user.ws.send(JSON.stringify({
							type: "connect",
							name: cuser.name,
							avatar: cuser.avatar,
							room: cuser.room,
							status: cuser.status,
							x: cuser.x,
							y: cuser.y,
							isPrivate: bIsPrivate
						}));
					}
			}
			break;
		case "changePosition":
			var user = this.parent;
			if (user.name == obj.name && obj.x != undefined && obj.y != undefined) {
				this.parent.x = obj.x;
				this.parent.y = obj.y;
				broadcast(this.parent, message.utf8Data);
			}
			break;
		case "privateChangePosition":
			var user = this.parent;
			if (user.name == obj.name && obj.px != undefined && obj.py != undefined) {
				if (user.private) {
					user.px = obj.px;
					user.py = obj.py;
					for (var i = 0; i < user.private.users.length; i++)
						if (user.private.users[i].name != user.name) {
							user.private.users[i].ws.send(message.utf8Data);
						}
				}
			}
			break;
		case "changeAvatar":
			var user = this.parent;
			if (user.name == obj.name && obj.avatar != undefined) {
				this.parent.avatar = obj.avatar;
				broadcast(this.parent, message.utf8Data, 1);
			}
			break;
		case "changeName":
			var notExist = 1;
			for (var i = 0; i < chat.users.length; i++)
				if (chat.users[i].name == obj.name) notExist = false;
			if (notExist) {
				var user = this.parent;
				if (obj.oldName == user.name && obj.name != undefined) {
					this.parent.name = obj.name;
					broadcast(this.parent, message.utf8Data, 1);
				}
			} else this.send('{"type":"alreadyUsed","name":"' + obj.oldName + '"}');
			break;
		case "changeStatus":
			var user = this.parent;
			if (obj.name == user.name && obj.status != undefined) {
				this.parent.status = obj.status;
				broadcast(this.parent, message.utf8Data, 1);
			}
		case "message":
			var user = this.parent;
			if (obj.name == user.name && obj.message)
				broadcast(this.parent, message.utf8Data);
			break;
	}
}

function broadcast(user, message, onprivate) {
	var room = chat.rooms[user.room];
	var sentList = [];
	for (var i = 0; i < room.users.length; i++)
		if (room.users[i].name != user.name) {
			sentList.push(room.users[i]);
			room.users[i].ws.send(message);
		}
	if (onprivate && user.private)
		for (var i = 0; i < user.private.users.length; i++)
			if (user.private.users[i].name && sentList.indexOf(user.private.users[i]) < 0)
				user.private.users[i].ws.send(message);
}

Chat.onClose = function () {
	var user = this.parent;
	if (user.isConnected) {
		var msg = '{"type":"disconnect","name":"' + user.name + '"}';
		var ret = chat.users.indexOf(user);
		if (ret != -1) chat.users.splice(ret, 1);
		var alreadySent = [];
		if (chat.rooms[user.room]) {
			chat.rooms[user.room].users.splice(chat.rooms[user.room].users.indexOf(user), 1);
			for (var i = 0; i < chat.rooms[user.room].users.length; i++) {
				var user0 = chat.rooms[user.room].users[i];
				user0.ws.send(msg);
				alreadySent.push(user0);
			}
		}
		if (user.private) {
			user.private.users.splice(user.private.users.indexOf(user), 1);
			for (var i = 0; i < user.private.users.length; i++) {
				var user0 = user.private.users[i];
				if (alreadySent.indexOf(user0) >= 0)
					user0.ws.send(msg);
			}
		}
	}
}

chat = new Chat();