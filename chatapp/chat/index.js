var urlvars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	urlvars[key] = value;
});

function $(x) { return document.getElementById(x) }
function $$(x) { return chat.private.document.getElementById(x) }
function hide(x) { x.className = "hidden"; }
function show(x) { x.className = ""; }

// Preload private.html
var xhr = new XMLHttpRequest();
xhr.open("GET", "private.html");
xhr.send();

var cfgxhr = new XMLHttpRequest();
cfgxhr.open("GET", "../config.xml", 0);
cfgxhr.send();
cfg = cfgxhr.responseXML;

var emoticons = [];
var els = cfg.getElementsByTagName("emoticons")[0].getElementsByTagName("emoticon");
for (var i = 0; i < els.length; i++) {
	var text = els[i].getElementsByTagName("text")[0].firstChild.nodeValue;
	var image = "graphics/emoticons/" + els[i].getElementsByTagName("image")[0].firstChild.nodeValue + ".png";
	emoticons.push([text, image]);
}

var sprites = ["smoke.png", "gas.png", "fire.png"];
for (var i = 0; i < sprites.length; i++) {
	var img = document.createElement("img");
	img.src = "graphics/particlesystem/" + sprites[i];
	sprites[sprites[i].substr(0, sprites[i].indexOf("."))] = img;
}

function ParticleSystem() { }
ParticleSystem.emitters = [];
ParticleSystem.pemitters = [];
ParticleSystem.manager = function () {
	var dt = (Date.now() - ParticleSystem.t0) / 1000;
	var draw = 0;
	for (var i = 0; i < ParticleSystem.emitters.length; i++) {
		var emitter = ParticleSystem.emitters[i];
		if (emitter.particles.length)
			draw = 1;
		emitter.process(dt, false);
	}
	if (draw) chat.draw();
	draw = 0;
	for (var i = 0; i < ParticleSystem.pemitters.length; i++) {
		var emitter = ParticleSystem.pemitters[i];
		if (emitter.particles.length)
			draw = 1;
		emitter.process(dt, true);
	}
	if (draw) chat.privateDraw();
	ParticleSystem.t0 = Date.now();
}
ParticleSystem.createEmitter = function () {
	var emitter = new ParticleSystem.Emitter();
	ParticleSystem.emitters.push(emitter);
	return emitter;
}
ParticleSystem.createPrivateEmitter = function () {
	var emitter = new ParticleSystem.Emitter();
	ParticleSystem.pemitters.push(emitter);
	return emitter;
}
ParticleSystem.destroyEmitter = function (emitter) {
	ParticleSystem.emitters.splice(ParticleSystem.emitters.indexOf(emitter), 1);
}
ParticleSystem.destroyPrivateEmitter = function (emitter) {
	ParticleSystem.pemitters.splice(ParticleSystem.pemitters.indexOf(emitter), 1);
}
ParticleSystem.Particle = function (x, y, dx, dy, v, lifetime) {
	this.r = Math.random() * Math.PI * 2;
}
ParticleSystem.Particle.prototype = {
	setPosition: function (x, y) { this.x = x; this.y = y; },
	setVelocity: function (v, dx, dy) { this.vx = v * dx; this.vy = v * dy; },
	setRotationVelocity: function (r) { this.rv = r; },
	setLifetime: function (l) { this.l0 = this.l = l; },
	setSize: function (s) { this.s = s; },
	setOpacity: function (o) { this.o = o; }
}

ParticleSystem.Emitter = function () {
	this.particles = [];
	this.gravity = 10;
	this.randomness = 0;
}
ParticleSystem.Emitter.prototype = {
	setUser: function (user) { this.user = user; },
	setSprite: function (sprite) { this.sprite = sprite; },
	setGravity: function (gravity) { this.gravity = gravity; },
	setVelocity: function (min, max) { this.vmin = min; this.vmax = max; },
	setLifetime: function (min, max) { this.lmin = min; this.lmax = max; },
	setRandomness: function (randomness) { this.randomness = randomness; },
	setRotationVelocity: function (min, max) { this.rvmin = min; this.rvmax = max; },
	setSize: function (min, max) { this.smin = min; this.smax = max; },
	setOpacity: function (min, max) { this.omin = min; this.omax = max; },
	createParticle: function (isPrivate) {
		var x, y;
		if (isPrivate) {
			x = this.user.px * chat.private.canvas.width;
			y = this.user.py * chat.private.canvas.height;
		} else {
			x = this.user.x * chat.width;
			y = this.user.y * chat.height;
		}
		var dx = Math.random() - 0.5;
		var dy = Math.random() - 0.5;
		var length = Math.sqrt(dx * dx + dy * dy);
		dx /= length;
		dy /= length;
		var particle = new ParticleSystem.Particle();
		particle.setPosition(x, y);
		particle.setVelocity(this.vmin + Math.random() * (this.vmax - this.vmin), dx, dy);
		particle.setLifetime(this.lmin + Math.random() * (this.lmax - this.lmin));
		particle.setRotationVelocity(this.rvmin + Math.random() * (this.rvmax - this.rvmin));
		particle.setSize(this.smin + Math.random() * (this.smax - this.smin));
		particle.setOpacity(this.omin + Math.random() * (this.omax - this.omin));
		this.particles.push(particle);
		this.nparticles--;
	},
	emit: function (nparticles, particlespersecond) {
		this.particles = [];
		this.nparticles = nparticles;
		this.pps = particlespersecond;
		this.counter = this.pps;
	},
	process: function (dt, isPrivate) {
		this.counter -= dt;
		while (this.counter <= 0 && this.nparticles > 0) {
			this.createParticle(isPrivate);
			this.counter += this.pps;
		}

		for (var i = 0; i < this.particles.length; i++) {
			var particle = this.particles[i];
			particle.l -= dt;
			particle.vy += this.gravity * dt;
			particle.r += particle.rv * dt;
			particle.x += particle.vx * dt;
			particle.y += particle.vy * dt;
			if (particle.l <= 0) this.particles.splice(this.particles.indexOf(particle), 1);
		}
	},
	render: function (ctx) {
		var sprite = this.sprite;
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		var particles = this.particles;
		for (var i = 0; i < particles.length; i++) {
			var particle = particles[i];
			ctx.save();
			ctx.translate(particle.x, particle.y);
			ctx.rotate(particle.r);
			ctx.scale(particle.s, particle.s);
			ctx.globalAlpha = particle.o * particle.l / particle.l0;
			ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
			ctx.restore();
		}
		ctx.restore();
	}
};

function Chat(name) {
	this.name = Chat.validateName(name);
	this.room = -1;
	this.avatar = -1;
	this.users = [];
	this.invitations = [];
}

Chat.capitalize = function (name) {
	return name.replace(name[0], name[0].toUpperCase())
}

Chat.prototype.refuse = function () {
	var user = this.invitations.shift();
	chat.ws.send('{"type":"refuse","name":"' + user.name + '"}');

	if (this.invitations.length) {
		$("avatarChatPrivateInvitationText").innerHTML = invitation.replace("%name", Chat.capitalize(this.invitations[0].name));
		chat.invitation.style.marginLeft = (-Math.floor(chat.invitation.offsetWidth / 2)) + "px";
	} else hide(this.invitation);
}

Chat.prototype.newRequest = function (user) {
	this.invitations.push(user);

	if (this.invitations.length == 1) {
		show($("avatarChatPrivateInvitation"));
		$("avatarChatPrivateInvitationText").innerHTML = invitation.replace("%name", Chat.capitalize(this.invitations[0].name));
		chat.invitation.style.marginLeft = (-Math.floor(chat.invitation.offsetWidth / 2)) + "px";
	}
}

Chat.prototype.invitePrivate = function () {
	var msg = '{"type":"invite","from":"' + this.name + '","name":"' + this.selection.name + '"}';
	this.ws.send(msg);
}

Chat.prototype.accept = function () {
	var user = this.invitations.shift();
	this.ws.send('{"type":"accept","name":"' + user.name + '"}');
	this.users[0].privateElement.className = "private";
	Chat.setPosition(this.users[0]);
	this.invitations = [];
	hide(this.invitation);
	this.private = window.open("private.html", "", "width=640,height=480");
}

Chat.prototype.writelog = function (text) {
	chat.log.innerHTML += text + "<br/>";
	chat.log.scrollTop = chat.log.scrollHeight;
}

Chat.prototype.getUserByName = function (name) {
	for (var i = 0; i < this.users.length; i++) {
		if (this.users[i].name == name)
			return this.users[i];
	}
	return 0;
}
Chat.prototype.getPrivateUserByName = function (name) {
	if (this.private)
		for (var i = 0; i < this.private.users.length; i++)
			if (this.private.users[i].name == name)
				return this.private.users[i];
	return 0;
}

Chat.STATUS = [
	"ONLINE",		// 0
	"ABSENT",		// 1
	"EATING",		// 2
	"IN THE PHONE"	// 3
];

// General component padding
Chat.PADDING = 20;
// Char dimension
Chat.CHAR_HEIGHT = 50;
Chat.CHAR_WIDTH = 50;
Chat.BLOB_TIMEOUT = 4000; // in milliseconds
Chat.BLOB_TIMEOUT_ADD_PER_WORD = 200; // in milliseconds
// To adjust the blob position
Chat.HEAD_OFFSET_X = 15;
Chat.HEAD_OFFSET_Y = -15;

Chat.validateName = function (name) {
	return name.toLowerCase();
}

Chat.setPosition = function (user) {
	user.blob.style.top = (chat.container.offsetTop + Math.floor(chat.height * user.y) - user.blob.offsetHeight + Chat.HEAD_OFFSET_Y) + "px";
	user.blob.style.left = chat.container.offsetLeft + Math.floor(chat.width * user.x) + Chat.HEAD_OFFSET_X + "px";

	user.nameElement.style.top = chat.container.offsetTop + Math.floor(user.y * chat.height) + (Chat.CHAR_HEIGHT / 2) + "px";
	user.nameElement.style.left = chat.container.offsetLeft + Math.floor(user.x * chat.width) + (-user.nameElement.offsetWidth / 2 - 1) + "px";

	user.statusElement.style.top = chat.container.offsetTop + Math.floor(user.y * chat.height) + (Chat.CHAR_HEIGHT / 2 - user.nameElement.offsetHeight + 2) + "px";
	user.statusElement.style.left = chat.container.offsetLeft + Math.floor(user.x * chat.width) + (-user.statusElement.offsetWidth / 2 - 1) + "px";

	user.privateElement.style.left = chat.container.offsetLeft + Math.floor(user.x * chat.width) + (-user.privateElement.offsetWidth / 2 - 1) + "px";
	user.privateElement.style.top = chat.container.offsetTop + Math.floor(user.y * chat.height) + (Chat.CHAR_HEIGHT / 2 - user.statusElement.offsetHeight - user.privateElement.offsetHeight) + "px";

	user.ignoredElement.style.left = chat.container.offsetLeft + Math.floor(user.x * chat.width) + (-user.ignoredElement.offsetWidth / 2 - 1) + "px";
	user.ignoredElement.style.top = chat.container.offsetTop + Math.floor(user.y * chat.height) + (Chat.CHAR_HEIGHT / 2 - user.statusElement.offsetHeight - user.privateElement.offsetHeight - user.ignoredElement.offsetHeight) + "px";
}

Chat.privateSetPosition = function (user) {
	user.privateBlob.style.top = (0 + Math.floor(chat.private.canvas.height * user.py) - user.privateBlob.offsetHeight + Chat.HEAD_OFFSET_Y) + "px";
	user.privateBlob.style.left = 0 + Math.floor(chat.private.canvas.width * user.px) + Chat.HEAD_OFFSET_X + "px";

	user.privateNameElement.style.top = 0 + Math.floor(user.py * chat.private.canvas.height) + (Chat.CHAR_HEIGHT / 2) + "px";
	user.privateNameElement.style.left = 0 + Math.floor(user.px * chat.private.canvas.width) + (-user.privateNameElement.offsetWidth / 2 - 1) + "px";

	user.privateStatusElement.style.top = 0 + Math.floor(user.py * chat.private.canvas.height) + (Chat.CHAR_HEIGHT / 2 - user.privateNameElement.offsetHeight + 2) + "px";
	user.privateStatusElement.style.left = 0 + Math.floor(user.px * chat.private.canvas.width) + (-user.privateStatusElement.offsetWidth / 2 - 1) + "px";

	user.privateIgnoredElement.style.left = 0 + Math.floor(user.px * chat.private.canvas.width) + (-user.privateIgnoredElement.offsetWidth / 2 - 1) + "px";
	user.privateIgnoredElement.style.top = 0 + Math.floor(user.py * chat.private.canvas.height) + (Chat.CHAR_HEIGHT / 2 - user.privateStatusElement.offsetHeight - user.privateElement.offsetHeight - user.privateIgnoredElement.offsetHeight) + "px";
}

function User(name, avatar, x, y, status) {
	this.name = Chat.validateName(name);
	this.avatar = avatar;
	this.x = x;
	this.y = y;
	this.status = status || 0;

	this.emitter = ParticleSystem.createEmitter();
	this.emitter.setUser(this);

	this.pemitter = ParticleSystem.createPrivateEmitter();
	this.pemitter.setUser(this);

	var user = this;
	user.nameElement = document.createElement("div");
	user.nameElement.className = "hidden name";
	user.nameElement.innerHTML = user.name;

	user.blob = document.createElement("div");
	user.blob.className = "hidden blob";

	user.statusElement = document.createElement("div");
	user.statusElement.className = "hidden status";
	user.statusElement.innerHTML = Chat.STATUS[user.status];

	user.privateElement = document.createElement("div");
	user.ignoredElement = document.createElement("div");
	user.privateElement.innerHTML = inprivate;
	user.ignoredElement.innerHTML = ignored;
	user.privateElement.className = "private hidden";
	user.ignoredElement.className = "ignored hidden";

	Chat.setPosition(user);


	user.privateNameElement = document.createElement("div");
	user.privateNameElement.className = "name";
	user.privateNameElement.innerHTML = user.name;

	user.privateBlob = document.createElement("div");
	user.privateBlob.className = "hidden blob";

	user.privateStatusElement = document.createElement("div");
	user.privateStatusElement.className = "hidden status";
	user.privateStatusElement.innerHTML = Chat.STATUS[user.status];

	user.privateIgnoredElement = document.createElement("div");
	user.privateIgnoredElement.innerHTML = "IGNORED";
	user.privateIgnoredElement.className = "ignored hidden";
}
User.prototype.free = function () {
	try {
		$("avatarChat").removeChild(this.statusElement);
		$("avatarChat").removeChild(this.nameElement);
		$("avatarChat").removeChild(this.blob);
		$("avatarChat").removeChild(this.ignoredElement);
		$("avatarChat").removeChild(this.privateElement);
	} catch (e) { }
}

User.prototype.privateFree = function () {
	try {
		$$("avatarChat").removeChild(this.privateStatusElement);
		$$("avatarChat").removeChild(this.privateNameElement);
		$$("avatarChat").removeChild(this.privateBlob);
		$$("avatarChat").removeChild(this.privateIgnoredElement);
	} catch (e) { }
}

User.prototype.fart = function (emitter) {
	emitter.setSprite(sprites["gas"]);
	emitter.setGravity(-40);
	emitter.setRandomness(10);
	emitter.setVelocity(10, 40);
	emitter.setLifetime(1, 3);
	emitter.setRotationVelocity(0.5, 0.6);
	emitter.setSize(0.5, 1);
	emitter.setOpacity(1, 1);
	emitter.emit(5, 0.05);
}

User.prototype.burn = function (emitter) {
	emitter.setSprite(sprites["fire"]);
	emitter.setGravity(-80);
	emitter.setRandomness(10);
	emitter.setVelocity(5, 10);
	emitter.setLifetime(1, 3);
	emitter.setRotationVelocity(0.5, 0.6);
	emitter.setSize(0.5, 0.75);
	emitter.setOpacity(1, 1);
	emitter.emit(100, 0.02);
}

Chat.prototype.privateSay = function (message, user) {
	message = message.substr(message.search(/\S/));

	if (user == this.private.users[0])
		this.ws.send(JSON.stringify({
			type: "privateMessage",
			name: user.name,
			"message": message
		}));

	if (message[0] == "/") {
		var words = message.split(" ");
		var command = words[0];
		switch (command) {
			case "/fart": user.fart(user.pemitter); break;
			case "/burn": user.burn(user.pemitter); break;
		}
		return;
	}
	clearInterval(user.privateBlobInterval);
	user.privateBlob.className = "blob";

	var msg = "";
	var length = 0;
	var words = message.split(" ");
	for (var i = 0; i < words.length; i++) {
		if (length >= 16) {
			msg += "<br/>";
			length = 0;
		}
		msg += words[i] + " ";
		length += words[i].length;
	}
	for (var i = 0; i < emoticons.length; i++) {
		var rgx = "";
		for (var j = 0; j < emoticons[i][0].length; j++)
			rgx += "[" + emoticons[i][0][j] + "]";
		msg = msg.replace(new RegExp(rgx, "g"), '<img src="' + emoticons[i][1] + '"  />');
		message = message.replace(new RegExp(rgx, "g"), '<img src="' + emoticons[i][1] + '" />');
	}
	chat.writelog("Private [" + Chat.capitalize(user.name) + "] " + message);
	user.privateBlob.innerHTML = msg;

	user.privateBlob.style.top = (Math.floor(chat.private.canvas.height * user.py) - user.privateBlob.offsetHeight + Chat.HEAD_OFFSET_Y) + "px";
	user.privateBlob.style.left = Math.floor(chat.private.canvas.width * user.px) + Chat.HEAD_OFFSET_X + "px";

	user.privateBlobInterval = setTimeout((function (user) {
		return function () {
			user.privateBlob.className = "blob hidden";
		}
	})(user), Chat.BLOB_TIMEOUT);
}

Chat.prototype.say = function (message, user) {
	user = user || this.users[0];
	message = message.substr(message.search(/\S/));

	if (user == this.users[0])
		this.ws.send(JSON.stringify({
			type: "message",
			name: user.name,
			"message": message
		}));

	if (message[0] == "/") {
		var words = message.split(" ");
		var command = words[0];
		switch (command) {
			case "/fart": user.fart(user.emitter); break;
			case "/burn": user.burn(user.emitter); break;
		}
		return;
	}
	clearInterval(user.blobInterval);
	user.blob.className = "blob";

	var msg = "";
	var length = 0;
	var words = message.split(" ");
	for (var i = 0; i < words.length; i++) {
		if (length >= 16) {
			msg += "<br/>";
			length = 0;
		}
		msg += words[i] + " ";
		length += words[i].length;
	}
	for (var i = 0; i < emoticons.length; i++) {
		var rgx = "";
		for (var j = 0; j < emoticons[i][0].length; j++)
			rgx += "[" + emoticons[i][0][j] + "]";
		msg = msg.replace(new RegExp(rgx, "g"), '<img src="' + emoticons[i][1] + '"  />');
		message = message.replace(new RegExp(rgx, "g"), '<img src="' + emoticons[i][1] + '"  />');
	}
	chat.writelog("[" + Chat.capitalize(user.name) + "] " + message);
	user.blob.innerHTML = msg;

	user.blob.style.top = (chat.container.offsetTop + Math.floor(chat.height * user.y) - user.blob.offsetHeight + Chat.HEAD_OFFSET_Y) + "px";
	user.blob.style.left = chat.container.offsetLeft + Math.floor(chat.width * user.x) + Chat.HEAD_OFFSET_X + "px";

	user.blobInterval = setTimeout((function (user) {
		return function () {
			user.blob.className = "blob hidden";
		}
	})(user), Chat.BLOB_TIMEOUT);
}

Chat.prototype.ignoreUser = function () {
	var user = this.selection;
	if (user.isIgnored) {
		user.ignoredElement.className = "ignored hidden";
		user.privateIgnoredElement.className = "ignored hidden";
		$("avatarChatIgnoreUser").innerHTML = "Ignore";
		user.isIgnored = false;
	} else {
		user.ignoredElement.className = "ignored";
		user.privateIgnoredElement.className = "ignored";
		$("avatarChatIgnoreUser").innerHTML = "Unignore";
		user.isIgnored = true;
	}
	Chat.setPosition(user);
	if (chat.private)
		Chat.privateSetPosition(user);
}

Chat.prototype.exitPrivate = function () {
	if (this.private) {
		this.private.close();
		this.private = 0;
		this.ws.send('{"type":"exitPrivate"}');
		this.users[0].privateElement.className = "private hidden";
		Chat.setPosition(this.users[0]);
	}
}

Chat.prototype.changeRoom = function (index) {
	if (this.room != -1) {
		if (index != this.room) {
			this.room = index;
			for (var i = 1; i < this.users.length; i++)
				this.users[i].free();
			this.users = [this.users[0]];

			if (this.ws && this.ws.readyState == WebSocket.OPEN) {
				this.ws.send(JSON.stringify({
					type: "changeRoom",
					name: this.name,
					room: this.room
				}));
			}
			this.draw();
		}
	} else {
		this.room = index;
		show($("avatarChatChangeAvatar"));
		$("avatarChatRoomX").className = "X";
	}
	if (Chat.roomNames[index].indexOf(".") >= 0) {
		this.bgimg.style.display = "none";
		this.embed.style.display = "block";
		this.embed.src = Chat.backgrounds[index].src + ".swf";
	} else {
		this.embed.style.display = "none";
		this.bgimg.style.display = "block";
		this.bgimg.src = Chat.backgrounds[index].src;
	}
}

Chat.prototype.announce = function (message) {
	$("avatarChatAnnouncement").style.display = "block";
	$("avatarChatAnnouncement").innerHTML = "->Admin: " + message + " <-";
	this.writelog("Announcement: " + message);
	setTimeout(function () {
		$("avatarChatAnnouncement").style.display = "none";
	}, 10000);
}

Chat.prototype.draw = function () {
	var img = Chat.backgrounds[this.room];
	//this.ctx.drawImage(img,0,0,this.width,this.height);
	this.ctx.clearRect(0, 0, chat.width, chat.height);
	for (var i = 0; i < this.users.length; i++) {
		var user = this.users[i];
		this.ctx.drawImage(Chat.avatars[user.avatar], Math.round(user.x * this.width - Chat.CHAR_WIDTH / 2), Math.floor(user.y * this.height - Chat.CHAR_HEIGHT / 2));
	}
	for (var i = 0; i < this.users.length; i++) {
		var user = this.users[i];
		user.emitter.render(this.ctx);
	}

}

Chat.prototype.privateDraw = function () {
	if (chat.private) {
		var ctx = this.private.ctx;
		ctx.clearRect(0, 0, chat.private.canvas.width, chat.private.canvas.height);
		for (var i = 0; i < chat.private.users.length; i++) {
			var user = chat.private.users[i];
			ctx.drawImage(Chat.avatars[user.avatar], Math.round(user.px * chat.private.canvas.width - Chat.CHAR_WIDTH / 2), Math.floor(user.py * chat.private.canvas.height - Chat.CHAR_HEIGHT / 2));
		}
		for (var i = 0; i < chat.private.users.length; i++) {
			var user = chat.private.users[i];
			user.pemitter.render(ctx);
		}

	}
}

Chat.prototype.changeStatus = function (status, user) {
	user = user || this.users[0];

	if (user.status != status) {
		user.status = status;
		this.writelog(Chat.capitalize(user.name) + " is now " + Chat.STATUS[user.status].toLowerCase());
		if (user == this.users[0])
			this.ws.send(JSON.stringify({
				type: "changeStatus",
				name: user.name,
				"status": user.status
			}));

		if (user.status == 0) {
			user.statusElement.className = "hidden status";
			user.privateStatusElement.className = "hidden status";
		} else {
			user.statusElement.innerHTML = Chat.STATUS[user.status];
			user.statusElement.className = "status";

			user.privateStatusElement.innerHTML = Chat.STATUS[user.status];
			user.privateStatusElement.className = "status";
		}
		Chat.setPosition(user);
		if (chat.private)
			Chat.privateSetPosition(user);
	}
}

Chat.prototype.getPosition = function (event, isMoving) {
	event._mx = (event.clientX - $("avatarChat").offsetLeft);
	event._my = (event.clientY - $("avatarChat").offsetTop);

	event._mx = Math.min(event._mx, Math.floor(chat.width - Chat.CHAR_WIDTH / 2));
	event._my = Math.min(event._my, Math.floor(chat.height - Chat.CHAR_HEIGHT / 2 - 18));
	event._mx = Math.max(event._mx, Math.ceil(Chat.CHAR_WIDTH / 2));
	event._my = Math.max(event._my, Math.ceil(Chat.CHAR_HEIGHT / 2));

	if (!isMoving) {
		var hit = 0;
		for (var i = 1; i < chat.users.length; i++)
			if (Math.abs(event._mx - chat.users[i].x * chat.width) <= Chat.CHAR_WIDTH / 2 && Math.abs(event._my - chat.users[i].y * chat.height) <= Chat.CHAR_HEIGHT / 2) {
				hit = 1;
				var user = chat.users[i];
				event._mx = user.x * chat.width + Chat.CHAR_WIDTH;
				event._my = user.y * chat.height;
				chat.selection = user;
				show($("invite"));
				var elem = $("ignore");
				elem.innerHTML = user.isIgnored ? unignore : ignore;
				show(elem);
			}
		if (hit == 0) {
			chat.selection = 0;
			hide($("invite"));
			hide($("ignore"));
		}
	}

	event._mx /= chat.width;
	event._my /= chat.height;
}

Chat.prototype.privateGetPosition = function (event, isMoving) {
	event._mx = (event.clientX);
	event._my = (event.clientY);

	event._mx = Math.min(event._mx, Math.floor(chat.private.canvas.width - Chat.CHAR_WIDTH / 2));
	event._my = Math.min(event._my, Math.floor(chat.private.canvas.height - Chat.CHAR_HEIGHT / 2 - 18));
	event._mx = Math.max(event._mx, Math.ceil(Chat.CHAR_WIDTH / 2));
	event._my = Math.max(event._my, Math.ceil(Chat.CHAR_HEIGHT / 2));

	event._mx /= chat.private.canvas.width;
	event._my /= chat.private.canvas.height;
}

Chat.prototype.changePosition = function (x, y, user, update) {
	user = user || this.users[0];
	user.x = x;
	user.y = y;

	if (update) {
		var obj = {
			type: "changePosition",
			name: user.name,
			x: user.x,
			y: user.y
		};
		this.ws.send(JSON.stringify(obj));
	}

	Chat.setPosition(user);

	this.draw();
}

Chat.prototype.privateChangePosition = function (x, y, user, update) {
	user = user || this.private.users[0];
	user.px = x;
	user.py = y;

	if (update) {
		var obj = {
			type: "privateChangePosition",
			name: user.name,
			px: user.px,
			py: user.py
		};
		this.ws.send(JSON.stringify(obj));
	}
	Chat.privateSetPosition(user);

	this.privateDraw();
}

Chat.prototype.changeAvatar = function (index, user) {
	user = user || this.users[0];
	if (user) {
		if (user.avatar != index) {
			if (user == this.users[0]) {
				this.avatar = index;
				this.ws.send(JSON.stringify({
					type: "changeAvatar",
					name: user.name,
					avatar: index
				}));
			}
			user.avatar = index;
			chat.draw();
			if (chat.private)
				chat.privateDraw();
		}
	} else this.avatar = index;
}

Chat.prototype.changeName = function (name, user, alreadyUsed) {
	name = Chat.validateName(name);
	user = user || this.users[0];
	if (user.name != name) {
		chat.writelog(username.replace("%name", Chat.capitalize(user.name)).replace("%newname", Chat.capitalize(name)));
		if (user == this.users[0]) {
			this.name = name;
			if (!alreadyUsed) {
				this.ws.send(JSON.stringify({
					type: "changeName",
					oldName: user.name,
					"name": name
				}));
			}
		}
		user.name = name;
		user.nameElement.innerHTML = name;
		user.privateNameElement.innerHTML = name;
		Chat.setPosition(user);
		if (chat.private)
			Chat.privateSetPosition(user);
	}
	hide($('avatarChatChangeName'));
}

Chat.prototype.quit = function () {
	this.ws.close();
	this.exitPrivate();
	clearInterval(chat.loadingInterval);

	hide($('avatarChatAccept'));

	hide($('avatarChatMain'));
	hide($('avatarChatConnection'));
	hide($('avatarChatReConnection'));


	for (var i = 0; i < chat.users.length; i++)
		var user = chat.users[i].free();

	hide($('avatarChatChangeStatus'));
	hide($('avatarChatChangeName'));
	hide($('avatarChatChangeAvatar'));
	hide($('avatarChatChangeRoom'));

	(window.onresize = function () {
		if (Chat.isFullscreen) {
			Chat.width = innerWidth;
			Chat.height = innerHeight;
		}
		Chat.container.style.width = Chat.width + "px";
		Chat.container.style.height = Chat.height + "px";

		Chat.connection.style.top = (Chat.container.offsetTop + (Chat.container.offsetHeight - Chat.connection.offsetHeight) / 2) + "px";
		Chat.connection.style.left = (Chat.container.offsetLeft + (Chat.container.offsetWidth - Chat.connection.offsetWidth) / 2) + "px";
	})();
}

Chat.switchLog = function () {
	var log = $("avatarChatLog");
	if (log.className == "hidden") {
		$("showlog").innerHTML = hidelog;
		show(log);
		log.scrollTop = log.scrollHeight;
	} else {
		$("showlog").innerHTML = showlog;
		hide(log);
	}
}

Chat.showChangeStatus = function () {
	show($('avatarChatChangeStatus'));
	hide($('avatarChatChangeName'));
	hide($('avatarChatChangeAvatar'));
	hide($('avatarChatChangeRoom'))
}

Chat.showChangeRoom = function () {
	hide($('avatarChatChangeStatus'));
	hide($('avatarChatChangeName'));
	hide($('avatarChatChangeAvatar'));
	show($('avatarChatChangeRoom'));
	var ws = new WebSocket("ws://" + cfg.getElementsByTagName("server")[0].firstChild.nodeValue + "/listrooms" + cfg.getElementsByTagName("rooms")[0].firstChild.nodeValue);
	ws.onmessage = function (e) {
		var arr = JSON.parse(e.data);
		var elements = $("avatarChatRoomImages").getElementsByTagName("b");
		for (var i = 0; i < elements.length; i++)
			elements[i].innerHTML = " (" + arr[i] + ")";
		this.close();
	}
}

Chat.showChangeName = function () {
	hide($('avatarChatChangeStatus'));
	show($('avatarChatChangeName'));
	$('avatarChatNewName').value = chat.name;
	hide($('avatarChatChangeAvatar'));
	hide($('avatarChatChangeRoom'))
}

Chat.showChangeAvatar = function () {
	hide($('avatarChatChangeStatus'));
	hide($('avatarChatChangeName'));
	show($('avatarChatChangeAvatar'));
	hide($('avatarChatChangeRoom'))
}

Chat.prototype.connect = function (server) {
	var user = new User(this.name, this.avatar, Math.random() * 0.5 + 0.25, Math.random() * 0.5 + 0.25)
	this.users.push(user);
	this.users[0].nameElement.className = "name hidden";
	avatarChat.appendChild(user.nameElement);
	avatarChat.appendChild(user.blob);
	avatarChat.appendChild(user.statusElement);
	avatarChat.appendChild(user.privateElement);
	avatarChat.appendChild(user.ignoredElement);
	Chat.setPosition(user);

	this.ws = new WebSocket("ws://" + server);
	this.ws.parent = this;
	this.ws.onopen = function () {
		var obj = {
			type: "connect",
			name: this.parent.users[0].name,
			avatar: this.parent.users[0].avatar,
			room: this.parent.room,
			status: this.parent.users[0].status,
			x: this.parent.users[0].x,
			y: this.parent.users[0].y
		}
		this.send(JSON.stringify(obj));

		$("avatarChatAvatarX").className = "X";
		setInterval(ParticleSystem.manager, 16);
	}
	this.ws.onmessage = function (e) {
		var obj = JSON.parse(e.data);
		switch (obj.type) {
			case "announcement":
				chat.announce(obj.message);
				break;
			case "exitPrivate":
				var user = chat.getPrivateUserByName(obj.name);
				if (chat.private) {
					chat.private.users.splice(chat.private.users.indexOf(user), 1);
					ParticleSystem.destroyEmitter(user.pemitter);
					user.privateFree();
					chat.privateDraw();
				}
				chat.writelog(userleft.replace("%name", Chat.capitalize(obj.name)));
				break;
			case "invite":
				var user = chat.getUserByName(obj.from);
				if (!user.isIgnored)
					chat.newRequest(user);
				break;
			case "privateCancel":
				chat.exitPrivate();
				chat.writelog(usernotfound);
				break;
			case "isPrivate":
				var user = chat.getUserByName(obj.name);
				user.isPrivate = true;
				user.privateElement.className = "private";
				Chat.setPosition(user);
				break;
			case "isNotPrivate":
				var user = chat.getUserByName(obj.name);
				user.isPrivate = false;
				user.privateElement.className = "private hidden";
				break;
			case "accept":
				if (!chat.private)
					show($("avatarChatAccept"));
				var user = chat.getUserByName(obj.name);
				chat.writelog(joinedprivate.replace("%name", Chat.capitalize(obj.name)));
				if (user) {
					user.px = obj.px;
					user.py = obj.py;
				} else {
					user = new User(obj.name, obj.avatar);
					chat.changeStatus(obj.status, user);
					user.nameElement.className = "name hidden";
					user.px = obj.px;
					user.py = obj.py;
				}
				if (!chat.loadingIntervals)
					chat.loadingIntervals = [];
				user.intervalIndex = chat.loadingIntervals.length;
				chat.loadingIntervals.push(setInterval((function (user) {
					return function () {
						if (chat.private)
							if (chat.private.wasLoaded) {
								chat.private.users.push(user);
								chat.private.avatarChat.appendChild(user.privateBlob);
								chat.private.avatarChat.appendChild(user.privateStatusElement);
								chat.private.avatarChat.appendChild(user.privateNameElement);
								chat.private.avatarChat.appendChild(user.privateIgnoredElement);
								Chat.privateSetPosition(user);
								chat.privateDraw();
								clearInterval(chat.loadingIntervals[user.intervalIndex]);
							}
					}
				})(user), 100));
				break;
			case "alert":
				alert(obj.message);
				break;
			case "connect":
				var user;
				user = chat.getPrivateUserByName(obj.name);
				if (user) {
					user.x = obj.x;
					user.y = obj.y;
				}
				else user = new User(obj.name, obj.avatar, obj.x, obj.y);
				chat.changeStatus(obj.status, user);
				user.nameElement.className = "name";
				var avatarChat = $("avatarChat");
				avatarChat.appendChild(user.nameElement);
				avatarChat.appendChild(user.blob);
				avatarChat.appendChild(user.statusElement);
				avatarChat.appendChild(user.privateElement);
				avatarChat.appendChild(user.ignoredElement);
				if (obj.isPrivate) {
					user.isPrivate = true;
					user.privateElement.className = "private";
				}

				chat.users.push(user);
				Chat.setPosition(user);
				chat.draw();

				chat.writelog(userjoin.replace("%name", Chat.capitalize(user.name)));
				break;
			case "leave":
				var name = obj.name;
				var user = chat.getUserByName(obj.name);
				if (user) {
					chat.users.splice(chat.users.indexOf(user), 1);
					ParticleSystem.destroyEmitter(user.emitter);
					user.free();
					chat.draw();
				}
				chat.writelog(userleft.replace("%name", Chat.capitalize(obj.name)));
				break;
			case "disconnect":
				var name = obj.name;
				var user = chat.getUserByName(obj.name);
				if (user) {
					user.free();
					chat.users.splice(chat.users.indexOf(user), 1);
					ParticleSystem.destroyEmitter(user.emitter);
					chat.draw();
				}
				user = chat.getPrivateUserByName(obj.name);
				if (user) {
					user.privateFree();
					chat.private.users.splice(chat.private.users.indexOf(user), 1);
					ParticleSystem.destroyPrivateEmitter(user.pemitter);
					chat.privateDraw();
				}
				chat.writelog(Chat.capitalize(obj.name) + " disconnected.");
				break;
			case "message":
				var user = chat.getUserByName(obj.name);
				if (!user.isIgnored)
					chat.say(obj.message, user);
				break;
			case "privateMessage":
				if (chat.private) {
					var user = chat.getPrivateUserByName(obj.name);
					if (!user.isIgnored)
						chat.privateSay(obj.message, user);
				}
				break;
			case "changeAvatar":
				var user = chat.getUserByName(obj.name);
				if (!user)
					user = chat.getPrivateUserByName(obj.name);
				chat.changeAvatar(obj.avatar, user);
				break;
			case "changeName":
				var user = chat.getUserByName(obj.oldName);
				if (!user)
					user = chat.getPrivateUserByName(obj.oldName);
				chat.changeName(obj.name, user);
				break;
			case "alreadyUsed":
				if (obj.name)
					chat.changeName(obj.name, chat.users[0], 1);
				else
					chat.quit();
				alert(nickinuse);
				break;
			case "changeStatus":
				var user = chat.getUserByName(obj.name);
				if (!user)
					user = chat.getPrivateUserByName(obj.name);
				chat.changeStatus(obj.status, user);
				break;
			case "changePosition":
				var user = chat.getUserByName(obj.name);
				chat.changePosition(obj.x, obj.y, user);
				break;
			case "privateChangePosition":
				if (chat.private) {
					var user = chat.getPrivateUserByName(obj.name);
					chat.privateChangePosition(obj.px, obj.py, user);
				}
				break;
			default:
				alert(obj);
				break;
		}
	}
	this.ws.onclose = function () {
		chat.quit();
		chat.writelog(disconnected);
		hide($("avatarChatConnection"));
		show($('avatarChatReConnection'));
		// alert(disconnected);
	}
}

Chat.loaded = 0;
Chat.backgrounds = [];
Chat.avatars = [];

function avatarChatConnect() {
	chat = new Chat(urlvars["name"], null);

	hide($("avatarChatConnection"));
	hide($('avatarChatReConnection'));
	Chat.showChangeRoom();

	chat.ads = $("avatarChatAds");
	chat.container = $("avatarChat");
	chat.canvas = $("avatarChatCanvas");
	chat.log = $("avatarChatLog");
	chat.input = $("avatarChatInput");
	chat.menu = $("avatarChatMenu");
	chat.invitation = $("avatarChatPrivateInvitation");
	chat.background = $("avatarChatBackground");
	chat.bgimg = chat.background.getElementsByTagName("img")[0];
	chat.embed = chat.background.getElementsByTagName("embed")[0];

	chat.ctx = chat.canvas.getContext("2d");

	chat.loadingInterval = setInterval(function () {
		var imagesLoaded = true;
		for (var i = 0; i < Chat.backgrounds.length; i++)
			imagesLoaded = imagesLoaded && Chat.backgrounds[i].isLoaded;
		for (var i = 0; i < Chat.avatars.length; i++)
			imagesLoaded = imagesLoaded && Chat.avatars[i].isLoaded;

		if (imagesLoaded && chat.room != -1 && chat.avatar != -1)
			if (chat.ws) {
				if (chat.ws.readyState == WebSocket.OPEN) {
					chat.writelog(youareconnected);
					clearInterval(chat.loadingInterval);
					chat.users[0].nameElement.className = "name";

					window.addEventListener("mouseup", function () { $("avatarChatCanvas").isDown = false });

					hide($("avatarChatConnection"));
					hide($('avatarChatReConnection'));
					show($("avatarChatMain"));

					chat.isFullscreen = chat.container.getAttribute("fullscreen");
					if (chat.isFullscreen)
						chat.isFullscreen = chat.isFullscreen.toLowerCase() == "true" ? true : false;

					chat.width = chat.container.getAttribute("width") || "800";
					chat.height = chat.container.getAttribute("height") || "600";

					if (chat.width) chat.width = parseInt(chat.width);
					if (chat.height) chat.height = parseInt(chat.height);

					if (chat.isFullscreen) {
						chat.container.style.position = "absolute";
						chat.container.style.top = chat.container.style.left = "0px";
					}
					(window.onresize = function () {
						if (chat.isFullscreen) {
							chat.width = innerWidth;
							chat.height = innerHeight;
						}
						chat.input.style.width = chat.width - Chat.PADDING + "px";
						chat.container.style.width = chat.width + "px";
						chat.container.style.height = chat.height + "px";

						chat.canvas.width = chat.width;
						chat.canvas.height = chat.height;

						chat.bgimg.style.width = chat.width + "px";
						chat.bgimg.style.height = chat.height + "px";
						chat.embed.width = chat.width;
						chat.embed.height = chat.height;

						chat.ads.style.width = chat.width - Chat.PADDING + "px";

						chat.menu.style.width = chat.width - Chat.PADDING + "px";

						chat.input.style.width = chat.width - Chat.PADDING + "px";
						chat.input.style.top = (chat.container.offsetTop + chat.container.offsetHeight - chat.input.offsetHeight - (Chat.PADDING >> 1)) + "px";
						chat.input.style.left = (chat.container.offsetLeft + Math.round(Chat.PADDING / 2)) + "px";

						chat.log.style.width = Math.round(chat.container.offsetWidth * 0.5 - Chat.PADDING) + "px";
						chat.log.style.height = Math.round(chat.container.offsetHeight * 0.5 - Chat.PADDING) + "px";
						chat.log.style.top = (chat.container.offsetTop + chat.container.offsetHeight - Math.round(chat.container.offsetHeight * 0.5) - chat.input.offsetHeight - Chat.PADDING) + "px";

						chat.invitation.style.marginLeft = (-Math.floor(chat.invitation.offsetWidth / 2)) + "px";

						for (var i = 0; i < chat.users.length; i++)
							Chat.setPosition(chat.users[i]);

						chat.draw();
					})();
					chat.input.style.left = (chat.container.offsetLeft + Math.round(Chat.PADDING / 2)) + "px";
				}
			} else chat.connect(cfg.getElementsByTagName("server")[0].firstChild.nodeValue);
	}, 100);
}
window.onunload = function () {
	if (chat)
		chat.quit();
}

function loadLanguage(language) {
	var innerHTMLs = ["openwindow", "title", "typename", "connect", "chooseroom", "choosename", "chooseavatar", "choosestatus", "changestatus", "showlog", "changeroom", "changeavatar", "changename", "exit", "confirm", "online", "absent", "eating", "phone", "accept", "reject", "invitationaccepted"];
	var variables = ["joinedprivate", "showlog", "hidelog", "youareconnected", "nickinuse", "ignore", "unignore", "invitation", "inprivate", "ignored", "disconnected", "userjoin", "userleft", "userstatus", "username", "userdisconnected"];
	var values = ["defaultname"];

	var status = ["online", "absent", "eating", "phone"];
	for (var i = 0; i < status.length; i++)
		Chat.STATUS[i] = language.getElementsByTagName(status[i])[0].firstChild.nodeValue;

	for (var i = 0; i < innerHTMLs.length; i++)
		$(innerHTMLs[i]).innerHTML = language.getElementsByTagName(innerHTMLs[i])[0].firstChild.nodeValue;
	for (var i = 0; i < values.length; i++)
		$(values[i]).value = language.getElementsByTagName(values[i])[0].firstChild.nodeValue;
	for (var i = 0; i < variables.length; i++)
		window[variables[i]] = language.getElementsByTagName(variables[i])[0].firstChild.nodeValue;

	var rooms = language.getElementsByTagName("rooms")[0].getElementsByTagName("room");
	Chat.roomNames = [];
	for (var i = 0; i < rooms.length; i++)
		Chat.roomNames.push(rooms[i].firstChild.nodeValue + (rooms[i].getAttribute("animated") == "true" ? ".swf" : ""));

	if ($("avatarChatChangeRoom").children[2]) {
		var children = $("avatarChatChangeRoom").children[2].children;
		var x = 0;
		for (var i = 0; i < children.length; i++)
			if (children[i].nodeName.toLowerCase() == "div") {
				var name = Chat.roomNames[x++];
				if (name.indexOf(".swf") >= 0)
					name = name.substr(0, name.indexOf(".swf"));
				children[i].children[1].innerHTML = name + "<b></b>";
			}
	}
}
function mouseClickSmile(event) {
	var input = document.getElementById("avatarChatInput");
	input.value += event.target.getAttribute("text");
	input.focus();
	switchSmile();

}

function switchSmile() {
	// setupSmileImages();
	var div = document.getElementById("avatarChatSmiles");
	if (div.style.display) div.style.display = "";
	else div.style.display = "block";
}



window.onload = function () {
	Chat.container = $("avatarChat");
	Chat.isFullscreen = Chat.container.getAttribute("fullscreen");
	Chat.connection = $("avatarChatConnection");
	Chat.reconnection = $("avatarChatReConnection");
	Chat.languages = cfg.getElementsByTagName("language");

	var languageLoaded = 0;

	for (var i = 0; i < Chat.languages.length; i++) {
		$("avatarChatLanguages").innerHTML += '<option value="' + Chat.languages[i].getAttribute("id") + '">' + Chat.languages[i].getElementsByTagName("name")[0].firstChild.nodeValue + "</option>";
		if (navigator.language.substr(0, 2) == Chat.languages[i].getAttribute("id")) {
			$("avatarChatLanguages").lastChild.setAttribute("selected", "selected");
			loadLanguage(Chat.languages[i]);
			languageLoaded = 1;
		}
	}
	$("avatarChatLanguages").firstChild.setAttribute("selected", "selected");
	if (!languageLoaded) loadLanguage(Chat.languages[0]);

	var rooms = parseInt(cfg.getElementsByTagName("rooms")[0].firstChild.nodeValue) || 1;
	var avatars = parseInt(cfg.getElementsByTagName("avatars")[0].firstChild.nodeValue) || 1;

	var offsetTop = 0;
	var offsetLeft = 0;
	for (var i = 0; i < rooms; i++) {
		var img;
		Chat.backgrounds[i] = img = new Image();
		img.isLoaded = false;
		img.onload = function () { this.isLoaded = true; }
		img.src = "graphics/backgrounds/bg" + i + ".jpg";

		img.index = i;
		if (!(i % 3) && i != 0) {
			$("avatarChatRoomImages").appendChild(document.createElement("br"));
			offsetTop += 175;
			offsetLeft = 0;
		} else if (i != 0) offsetLeft += 170;
		img.onclick = function () { chat.changeRoom(this.index); hide($("avatarChatChangeRoom")); }
		var roomOption = document.createElement("div");
		roomOption.className = "roomOption";
		$("avatarChatRoomImages").appendChild(roomOption);
		roomOption.appendChild(img);
		var roomName = document.createElement("div");
		roomName.index = i;

		var indexDot = Chat.roomNames[i].indexOf(".");
		roomName.innerHTML = Chat.roomNames[i].substr(0, indexDot == -1 ? Chat.roomNames[i].length : indexDot) || "Room " + i;
		roomOption.appendChild(roomName);
		roomName.appendChild(document.createElement("b"));
	}

	for (var i = 0; i < avatars; i++) {
		Chat.avatars[i] = new Image();
		Chat.avatars[i].isLoaded = false;
		Chat.avatars[i].onload = function () { this.isLoaded = true; }
		Chat.avatars[i].src = "graphics/avatars/avatar" + i + ".png";

		var img = new Image();
		img.src = Chat.avatars[i].src;
		img.index = i;
		if (!(i % 8) && i != 0) $("avatarChatAvatarImages").appendChild(document.createElement("br"));
		img.onclick = function () { chat.changeAvatar(this.index); hide($("avatarChatChangeAvatar")); }
		$("avatarChatAvatarImages").appendChild(img);
	}
	setupSmileImages()
	var loadedSmileImages = false;
	function setupSmileImages() {
		if (!loadedSmileImages) {
			for (var i = 0; i < emoticons.length; i++) {
				var img = document.createElement("img");
				img.setAttribute("text", emoticons[i][0]);
				img.src = emoticons[i][1];
				img.setAttribute("onclick", "mouseClickSmile(event)");
				$("avatarChatSmiles").appendChild(img);
				if (i != 0 && i % 10 == 0) $("avatarChatSmiles").appendChild(document.createElement("br"));
			}
			loadedSmileImages = true;
		}
	}


	if (Chat.isFullscreen)
		Chat.isFullscreen = Chat.isFullscreen.toLowerCase() == "true" ? true : false;

	Chat.width = Chat.container.getAttribute("width") || "800";
	Chat.height = Chat.container.getAttribute("height") || "600";

	if (Chat.width) Chat.width = parseInt(Chat.width);
	if (Chat.height) Chat.height = parseInt(Chat.height);

	if (Chat.isFullscreen) {
		Chat.container.style.position = "absolute";
		Chat.container.style.top = Chat.container.style.left = "0px";
	}

	(window.onresize = function () {
		if (Chat.isFullscreen) {
			Chat.width = innerWidth;
			Chat.height = innerHeight;
		}
		Chat.container.style.width = Chat.width + "px";
		Chat.container.style.height = Chat.height + "px";

		Chat.connection.style.top = (Chat.container.offsetTop + (Chat.container.offsetHeight - Chat.connection.offsetHeight) / 2) + "px";
		Chat.connection.style.left = (Chat.container.offsetLeft + (Chat.container.offsetWidth - Chat.connection.offsetWidth) / 2) + "px";
	})();

	$("defaultname").value = urlvars["name"];
	loadLanguage(Chat.languages[parseInt(urlvars["language"])]);
	avatarChatConnect();
}