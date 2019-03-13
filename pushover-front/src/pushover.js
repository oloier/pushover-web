const fs = require("fs")
const https = require("https")
const url = require("url")
const qs = require("querystring")
const pUrl = "https://api.pushover.net/1/messages.json"
const path = require("path")

function setDefaults (o) {
	const def = [
		"device",
		"title",
		"url",
		"url_title",
		"priority",
		"timestamp",
		"sound",
	]

	for (const i of def) {
		if (!o[def[i]]) {
			o[def[i]] = ""
		}
	}

	return o
}

function loadImage(imgPath) {
	const o = {}
	o.name = path.basename(imgPath)
	o.data = fs.readFileSync(imgPath)
	return o
}


function reqString2MP(rs, b, imgObj) {
	const a = []
	const o = qs.parse(rs)

	a.push(b)

	for (const p in o) {
		if (o[p] !== "") {
			a.push('Content-Disposition: form-data; name="' + p + '"')
			a.push("")
			a.push(o[p])
			a.push(b)
		}
	}

	if (imgObj) {
		a.push('Content-Disposition: form-data; name="attachment"; filename="' + imgObj.name + '"')
		if (imgObj.hasOwnProperty("type")) {
			a.push("Content-Type: " + imgObj.type)
		}
		else {
			a.push("Content-Type: application/octet-stream")
		}
		a.push("")
		a.push("")
	}
	else {
		a.splice(-1, 1)
	}

	let payload
	if (imgObj) {
		payload = Buffer.concat([
			Buffer.from(a.join("\r\n"), "utf8"),
			Buffer.from(imgObj.data, "binary"),
			Buffer.from("\r\n" + b + "--\r\n", "utf8"),
		])
	}
	else {
		payload = Buffer.concat([
			Buffer.from(a.join("\r\n"), "utf8"),
			Buffer.from(b + "--\r\n", "utf8"),
		])
	}
	return payload
}

function Pushover (opts) {
	const self = this
	this.boundary = "--" + Math.random().toString(36).substring(2)
	this.token = opts.token
	this.user = opts.user
	this.httpOptions = opts.httpOptions
	this.sounds = {
		pushover: "Pushover (default)",
		bike: "Bike",
		bugle: "Bugle",
		cashregister: "Cash Register",
		classical: "Classical",
		cosmic: "Cosmic",
		falling: "Falling",
		gamelan: "Gamelan",
		incoming: "Incoming",
		intermission: "Intermission",
		magic: "Magic",
		mechanical: "Mechanical",
		pianobar: "Piano Bar",
		siren: "Siren",
		spacealarm: "Space Alarm",
		tugboat: "Tug Boat",
		alien: "Alien Alarm (long)",
		climb: "Climb (long)",
		persistent: "Persistent (long)",
		echo: "Pushover Echo (long)",
		updown: "Up Down (long)",
		none: "None (silent)",
	}

	if (opts.debug) {
		this.debug = opts.debug
	}

	if (opts.onerror) {
		this.onerror = opts.onerror
	}

	if (opts.update_sounds) {
		self.updateSounds()
		setInterval(() => {
			self.updateSounds()
		}, 86400000)
	}
}


Pushover.prototype.errors = function (d, res) {
	if (typeof d === "string") {
		d = JSON.parse(d)
	}

	if (d.errors) {
		if (this.onerror) {
			this.onerror(d.errors[0], res)
		}
		else {
			throw new Error(d.errors[0], res)
		}
	}
}

Pushover.prototype.updateSounds = function () {
	const self = this
	let data = ""
	const surl = "https://api.pushover.net/1/sounds.json?token=" + self.token
	const req = https.request(url.parse(surl), (res) => {
		res.on("end", () => {
			const j = JSON.parse(data)
			self.errors(data, res)
			self.sounds = j.sounds
		})

		res.on("data", (chunk) => {
			data += chunk
		})
	})

	req.on("error", (e) => {
		self.errors(e)
	})

	req.write("")
	req.end()
}

Pushover.prototype.send = function (obj, fn) {
	const self = this
	const o = url.parse(pUrl)
	let proxy
	o.method = "POST"

	obj = setDefaults(obj)

	let reqString = {
		token: self.token || obj.token,
		user: self.user || obj.user,
	}

	for (const p in obj) {
		if (obj[p] !== "") {
			if (p !== "file") {
				reqString[ p ] = obj[p]
			}
		}
	}

	reqString = qs.stringify(reqString)

	let mp
	if (obj.file) {
		if (typeof obj.file === "string") {
			mp = reqString2MP(reqString, self.boundary, loadImage(obj.file))
		}
		if (typeof obj.file === "object") {
			mp = reqString2MP(reqString, self.boundary, obj.file)
		}
	}
	else {
		mp = reqString2MP(reqString, self.boundary)
	}

	o.headers = {
		"Content-type": "multipart/form-data; boundary=" + self.boundary.substring(2),
		"Content-Length": mp.length,
	}

	const httpOpts = self.httpOptions || {}
	if (httpOpts) {
		Object.keys(httpOpts).forEach((key) => {
			if (key !== "proxy") {
				o[key] = httpOpts[key]
			}
		})
	}

	if (httpOpts.hasOwnProperty("proxy") && httpOpts.proxy && httpOpts.proxy !== "") {
		proxy = url.parse(httpOpts.proxy)
		o.headers.Host = o.host
		o.host = proxy.hostname
		o.protocol = proxy.protocol
	}

	const req = https.request(o, (res) => {
		if (self.debug) {
			console.log(res.statusCode)
		}
		let err
		let data = ""
		res.on("end", () => {
			self.errors(data, res)
			if (fn) {
				fn(err, data, res)
			}
		})

		res.on("data", (chunk) => {
			data += chunk
		})
	})

	req.on("error", (err) => {
		if (fn) {
			fn(err)
		}
		// in the tests the "end" event did not get emitted if  "error" was emitted,
		// but to be sure that the callback is not get called twice, null the callback function
		fn = null
	})

	if (self.debug) {
		console.log(reqString.replace(self.token, "XXXXX").replace(self.user, "XXXXX"))
	}

	req.write(mp)
	req.end()
}

exports = module.exports = Pushover
