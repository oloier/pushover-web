const express = require("express")
const router = express.Router()
const userController = require("../controllers/user")
const user = new userController()

router.post("/login", async (req, res, next) => {
	try {
		// update user, update session with user
		await user.authenticate(req.query.email, req.query.password)
		req.session.user = user
		res.send("logged in?")
	}
	catch (ex) {
		res.send("nope?")
		next(ex)
	}
})

router.post("/register", async (req, res, next) => {
	try {
		// update user, update session with user
		await user.register(req.query.email, req.query.password)
		console.info("registered??")
		req.session.user = user
		res.send("register....here")
	}
	catch (ex) {
		next(ex)
	}
})

module.exports = router
