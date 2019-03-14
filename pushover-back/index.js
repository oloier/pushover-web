require("dotenv").config()
const path = require("path")
const express = require("express")
const app = express()
const pushover = require("./controllers/pushover")
const bodyParser = require("body-parser")
const multer = require("multer")

app.use(bodyParser.json())
app.use(express.urlencoded({extended: true }))
app.disable("x-powered-by")
app.set("json spaces", 2)
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

const storage = multer.diskStorage({
	destination: "./uploads",
	filename: function (req, file, cb) {
		const ext = null
		switch (file.mimetype) {
		case "image/jpeg":
			break
		case "image/png":
			break
		default:
			return
		}
		cb(null, file.originalname)
	},
})

const upload = multer({
	storage,
	fileFilter: function (req, file, cb) {
		const filetypes = /jpeg|jpg|png/
		const mimetype = filetypes.test(file.mimetype)
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
	
		if (mimetype && extname) {
			return cb(null, true)
		}
		cb("Error: File upload only supports the following filetypes - " + filetypes)
	},
})
app.post("/upload", upload.single("attachment"), (req, res) => {
	res.send("success")
})

const push = new pushover({
	user: "uJRHDRwW9oY7Y4HV8zuoxk7HXRcTk2",
	token: "am1cbmv6x4kpirncym48pf1w63tb3w",
	debug: true,
	onError: (err) => {
		console.log(err)
	},
})

// push.send({
// 	message: "bro",
// 	title: "Good news!...?",
// 	sound: "intermission",
// 	device: "drell",
// 	priority: 1,
// 	file: "uploads/img.jpg",
// })

app.post("/", (req, res) => {

	const message = req.body.message
	const title = req.body.title
	const url = req.body.url
	const file = req.body.attachment ? `uploads/${path.basename(req.body.attachment)}` : null

	const opts = {
		message,
		title,
		url,
		file,
		sound: "intermission",
		device: "drell",
		priority: 1,
	}
	console.log(opts)
	push.send(opts, (err, response) => {
		if (err) {
			throw new Error(err)
		}
		res.json(response)
	})
	// save any attachments

})

// global error handler middleware, receives all Error exception
// instances and responds with a 200 JSON response body
app.use(require("./handlers/errorHandler"))

module.exports = app
