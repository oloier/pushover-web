require("dotenv").config()
const express = require("express")
const app = express()
const pushover = require("./controllers/pushover")
const bodyParser = require("body-parser")

app.use(bodyParser.json())
app.use(express.urlencoded({extended: true }))
app.disable("x-powered-by")
app.set("json spaces", 2)

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})
  
// default home request
app.post("/", (req, res) => {
	const message = req.body.message
	const title = req.body.title
	const url = req.body.url
	const file = req.body.file

	const push = new pushover({
		user: "uJRHDRwW9oY7Y4HV8zuoxk7HXRcTk2",
		token: "am1cbmv6x4kpirncym48pf1w63tb3w",
		debug: true,
		onError: (err) => {
			console.log(err)
		},
	})

	push.send({
		message,
		title,
		url,
		sound: "intermission",
		device: "drell",
		priority: 1,
	}, (err, response) => {
		if (err) {
			throw new Error(err)
		}
		res.json(response)
	})
	
	console.log(req.body)

	
	
	// push.send({
	// 	message: "bro",
	// 	title: "Good news!...?",
	// 	sound: "intermission",
	// 	device: "drell",
	// 	priority: 1,
	// 	file: "img.jpg",
	// })
	
})

// global error handler middleware, receives all Error exception
// instances and responds with a 200 JSON response body
app.use(require("./handlers/errorHandler"))

module.exports = app
