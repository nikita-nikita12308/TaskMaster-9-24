// ./database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Specify the path to the database file
const dbPath = path.resolve(__dirname, 'bot_database.db');
const db = new sqlite3.Database(dbPath);

module.exports = db;
