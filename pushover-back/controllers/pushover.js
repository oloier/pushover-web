const fs = require("fs")
const https = require("https")
const url = require("url")
const querystring = require("querystring")
const path = require("path")
const apiUrl = "https://api.pushover.net/1/messages.json"

function setDefaults(message) {
	const params = [
		"device",
		"title",
		"url",
		"url_title",
		"priority",
		"timestamp",
		"sound",
	]

	for (const i of params) {
		if (!message[params[i]]) {
			message[params[i]] = ""
		}
	}

	return message
}

function loadImage(imgPath) {
	const image = {}
	image.name = path.basename(imgPath)
	image.data = fs.readFileSync(imgPath)
	return image
}

function requestStringToMultiPart(requestString, boundary, imgObj) {
	const reqArray = []
	const params = querystring.parse(requestString)

	reqArray.push(boundary)

	for (const prop in params) {
		if (params[prop] !== "") {
			reqArray.push('Content-Disposition: form-data; name="' + prop + '"')
			reqArray.push("")
			reqArray.push(params[prop])
			reqArray.push(boundary)
		}
	}

	if (typeof imgObj !== "undefined") {
		reqArray.push('Content-Disposition: form-data; name="attachment"; filename="' + imgObj.name + '"')
		if (imgObj.hasOwnProperty("type")) {
			reqArray.push("Content-Type: " + imgObj.type)
		}
		else {
			reqArray.push("Content-Type: application/octet-stream")
		}
		reqArray.push("").push("")
	}
	else {
		reqArray.splice(-1, 1)
	}

	if (typeof imgObj !== "undefined") {
		return Buffer.concat([
			Buffer.from(reqArray.join("\r\n"), "utf8"),
			Buffer.from(imgObj.data, "binary"),
			Buffer.from("\r\n" + boundary + "--\r\n", "utf8"),
		])
	}
	else {
		return Buffer.concat([
			Buffer.from(reqArray.join("\r\n"), "utf8"),
			Buffer.from(boundary + "--\r\n", "utf8"),
		])
	}
}


class Pushover {
	constructor(opts) {
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
		this.debug = opts.debug || null
		this.onError = opts.onError || null
		
		if (opts.update_sounds) {
			this.updateSounds()
			setInterval(() => {
				this.updateSounds()
			}, 86400000)
		}
	}

	errors(data, res) {
		data = (typeof data === "string") ? JSON.parse(data) : null
	
		if (data.errors) {
			if (this.onError) {
				this.onError(data.errors[0], res)
			}
			else {
				throw new Error(data.errors[0], res)
			}
		}
	}

	updateSounds() {
		let data = ""
		const surl = "https://api.pushover.net/1/sounds.json?token=" + this.token
		
		const req = https.request(url.parse(surl), (res) => {
			res.on("end", () => {
				const j = JSON.parse(data)
				this.errors(data, res)
				this.sounds = j.sounds
			})
			res.on("data", (chunk) => data += chunk)
		})
	
		req.on("error", (e) => this.errors(e))
		req.write("")
		req.end()
	}

	send(messageObj, callback) {
		const apiParams = url.parse(apiUrl)
		let proxy
		apiParams.method = "POST"

		messageObj = setDefaults(messageObj)

		let reqString = {
			token: this.token || messageObj.token,
			user: this.user || messageObj.user,
		}

		for (const prop in messageObj) {
			if (messageObj[prop] !== "") {
				if (prop !== "file") {
					reqString[prop] = messageObj[prop]
				}
			}
		}

		reqString = querystring.stringify(reqString)

		let multipart
		if (messageObj.file) {
			if (typeof messageObj.file === "string") {
				multipart = requestStringToMultiPart(reqString, this.boundary, loadImage(messageObj.file))
			}
			if (typeof messageObj.file === "object") {
				multipart = requestStringToMultiPart(reqString, this.boundary, messageObj.file)
			}
		}
		else {
			multipart = requestStringToMultiPart(reqString, this.boundary)
		}

		apiParams.headers = {
			"Content-type": "multipart/form-data; boundary=" + this.boundary.substring(2),
			"Content-Length": multipart.length,
		}

		const httpOpts = this.httpOptions || {}
		if (httpOpts) {
			Object.keys(httpOpts).forEach((key) => {
				if (key !== "proxy") {
					apiParams[key] = httpOpts[key]
				}
			})
		}

		if (httpOpts.hasOwnProperty("proxy") && httpOpts.proxy && httpOpts.proxy !== "") {
			proxy = url.parse(httpOpts.proxy)
			apiParams.headers.Host = apiParams.host
			apiParams.host = proxy.hostname
			apiParams.protocol = proxy.protocol
		}

		const req = https.request(apiParams, (res) => {
			if (this.debug) {
				console.log(res.statusCode)
			}

			let data = ""
			res.on("end", () => {
				this.errors(data, res)
				if (callback) {
					callback("", data, res)
				}
			})

			res.on("data", (chunk) => data += chunk)
		})

		req.on("error", (err) => {
			if (callback) {
				callback(err)
			}
			// in the tests the "end" event did not get emitted if  "error" was emitted,
			// but to be sure that the callback is not get called twice, null the callback function
			callback = null
		})

		if (this.debug) {
			console.log(reqString.replace(this.token, "XXXXX").replace(this.user, "XXXXX"))
		}

		req.write(multipart)
		req.end()
	}
}

exports = module.exports = Pushover
