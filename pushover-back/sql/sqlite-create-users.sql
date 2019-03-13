DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users(
	userid INTEGER PRIMARY KEY, 
	email TEXT NOT NULL, 
	password TEXT NOT NULL, 
	token TEXT, 
	datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
	dateupdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT unique_flags UNIQUE (email)
);

CREATE TRIGGER [dateupdatedTrigger]
	AFTER UPDATE ON users
	FOR EACH ROW
	WHEN NEW.dateupdated < OLD.dateupdated
	BEGIN
		UPDATE users SET dateupdated=CURRENT_TIMESTAMP WHERE userid=OLD.userid;
	END;
