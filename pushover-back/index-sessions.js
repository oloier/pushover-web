require("dotenv").config()
const express = require("express")
const app = express()
const session = require("express-session")

app.use(express.urlencoded({
	extended: false,
}))
app.disable("x-powered-by")
app.set("json spaces", 2)
// express-session setup
app.set("trust proxy", 1)
app.use(session({
	secret: ["something", "other thing", "ihavenodeawhatimdoing"],
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: true,
		maxAge: 60000,
	},
}))

// default home request
app.get("/", (req, res) => {
	const test = req.session.user === undefined || !req.session.user ? {} : req.session.user
	if (test.email !== undefined) {
		res.send(`Welcome, ${test.email}`)
	}
	res.status(200).send("stuff. Not logged in.")
})

// login and registration 
app.use("/", require("./handlers/userHandler"))

// global error handler middleware, receives all Error exception
// instances and responds with a 200 JSON response body
app.use(require("./handlers/errorHandler"))

module.exports = app
