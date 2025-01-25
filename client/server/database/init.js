const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const initializeDatabase = () => {
    const db = new sqlite3.Database(config.DATABASE_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Connected to SQLite database');
            createTables(db);
        }
    });
    return db;
};

const createTables = (db) => {
    
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            
            const adminPassword = bcrypt.hashSync('admin123', 10);
            db.run(`
                INSERT OR IGNORE INTO users (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `, ['admin', 'admin@example.com', adminPassword, 'admin']);
        }
    });

    
    db.run(`
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action_type TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            target_user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (target_user_id) REFERENCES users (id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating activities table:', err);
        }
    });
};

module.exports = initializeDatabase;