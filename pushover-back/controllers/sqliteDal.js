const sqlite3 = require("sqlite3")
const sqlite = new sqlite3.Database(process.env.DB_PATH)

module.exports = class SQLite {
	
	async query(sql, params) {
		const stmt = sqlite.prepare(sql, params)
		const rows = await this.getResults(stmt) 
		stmt.finalize() 
		return rows
	}

	async execute(sql, params) {
		const stmt = sqlite.prepare("INSERT INTO users (email, password) VALUES (?,?)")
		// await stmt.run(params, (err) => {
		// 	if (err) {
		// 		throw new Error(err)
		// 	}
		// 	stmt.finalize() 
		// 	sqlite.close()	
		// 	return this.lastID
		// }) 
		await stmt.run(params) 
		stmt.finalize() 
		sqlite.close()	
	}

	/**
	 * wraps SQLite3's statement results callback into promise
	 * @param {SQLite3.Statement} - prepared SQLite query statement
	 * @returns promise of query results
	 */
	getResults (stmt) {
		return new Promise((resolve, reject) => {
			stmt.all((err, rows) => { 
				if (err) {
					return reject(err)
				}
				resolve(rows)
			})
		})
	}

}
