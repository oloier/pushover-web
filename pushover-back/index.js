require("dotenv").config()
const path = require("path")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cors = require("cors")
const multer = require("multer")
const pushover = require("./controllers/pushover")

app.use(bodyParser.json()) // required for accepting json POSTs
app.use(express.urlencoded({extended: true }))
app.disable("x-powered-by")
app.set("json spaces", 2)
app.use(cors())

// configure multer filenaming and filtering
const upload = multer({
	storage: multer.diskStorage({
		destination: "./uploads",
		filename: (req, file, cb) => cb(null, file.originalname),
	}),
	fileFilter: (req, file, cb) => {
		const filetypes = /jpeg|jpg|png/
		const mimetype = filetypes.test(file.mimetype)
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
	
		if (mimetype && extname) {
			return cb(null, true)
		}
		cb("Error: File upload only supports the following filetypes - " + filetypes)
	},
})

//
// file upload endpoint, preceding pushover root post
//
app.post("/upload", upload.single("attachment"), (req, res) => {
	res.send("success")
})

//
// primary POST endpoint for form data to send pushover notifications
//
app.post("/", (req, res) => {
	const message = req.body.message
	const title = req.body.title
	const url = req.body.url
	const file = req.body.attachment ? `uploads/${path.basename(req.body.attachment)}` : null

	const push = new pushover({
		user: "uJRHDRwW9oY7Y4HV8zuoxk7HXRcTk2",
		token: "am1cbmv6x4kpirncym48pf1w63tb3w",
		// debug: true,
		onError: (err) => {
			console.log(err)
		},
	})

	push.send({
		message,
		title,
		url,
		file,
		sound: "intermission",
		device: "drell",
		priority: 0,
		// priority: 2,
		// retry: 60,
		// expire: 500,
	},
	(err, response) => {
		if (err) {
			throw new Error(err)
		}
		res.json(response)
	})
})

// global error handler middleware, receives all Error exception
// instances and responds with a 200 JSON response body
app.use(require("./handlers/errorHandler"))

module.exports = app
