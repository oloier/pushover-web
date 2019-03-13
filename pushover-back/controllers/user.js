const sqlite = require("./sqliteDal")
const bcrypt = require("bcryptjs")

/**
 * user class used for registration, retrieval of access token, and auth'ing requests
 * @class user
 */
class user {
	constructor(email, password) {    
		this.email = email
		this.token = ""
	}

	/**
	 * check if provided email exists as registered user
	 * @param {string} email
	 * @returns {boolean} returns if user with provided email was found
	 * @memberof user
	 */
	async emailExists(email) {
		const sql = "SELECT * FROM users WHERE email=? LIMIT 1"
		const row = await sqlite.query(sql, [email])
		if (row === undefined || row.length === 0) {
			const err = new Error("user not found")
			err.code = 404
			throw err
		}
		return false
	}

	/**
	 * registers new user to users table in chosen db engine
	 * @param {string} email - user email
	 * @param {string} password - user password
	 * @memberof user
	 */
	async register(email, password) {
		if (!email || !password) {
			const err = new Error("missing email and/or password")
			err.code = 422
			throw err
		}

		const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		if (!re.test(email)) {
			const err = new Error("invalid email address")
			err.code = 422
			throw err
		}

		// if email is found, throw error state; disallows duplicate registration
		const exist = await this.emailExists(email)
		if (exist) {
			throw new Error("email already registered")
		}

		// hash and salt the user password, bless the bcrypt
		const passHash = await bcrypt.hash(password, 8)

		// populate query with posted form, execute
		const sql = "INSERT INTO users (email, password) VALUES (?,?)"
		await sqlite.execute(sql, [email, passHash])

		const newUser = await user.getOne(email)
		if (newUser === undefined || newUser.length === 0) {
			const err = new Error("unknown error in registration")
			err.code = 400
			throw err
		}

		// successfully authenticated, store the info
		this.email = newUser.email
		this.token = newUser.token
	}

	
	/**
	 * authenticate / login existing user to fetch pushover token
	 * @param {string} email
	 * @param {string} password
	 * @returns 
	 * @memberof user
	 */
	async authenticate(email, password) {
		const user = await this.getOne(email)
		const pmatch = bcrypt.compareSync(password, user.password)
		if (!pmatch || (user === undefined || user.length === 0)) {
			const err = new Error("invalid login credentials")
			err.code = 403
			throw err
		}
		this.email = user.email
		this.token = user.token
	}
}

module.exports = user
