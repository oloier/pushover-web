const errorHandler = (err, req, res, next) => {
	console.info(`logging error code: ${err.code}`)
	res.status(200).json({
		message: err.message,
	})
	console.error(err.stack)
}

module.exports = errorHandler
