const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bot_database.db');

// Drop existing tables
db.serialize(() => {
  db.run('DROP TABLE IF EXISTS tasks');
  db.run('DROP TABLE IF EXISTS topics');
  db.run('DROP TABLE IF EXISTS groups');
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS user_group_topics');

  // Create updated schema
  // Create a table for groups
  db.run(`
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
)
`);

  // Create a table for topics
  db.run(`
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL
)
`);

  // Create a table for users
  db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  selected_group_id INTEGER
)
`);

  // Create a table for tasks
  db.run(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER,
  user_id INTEGER,
  topic_slug TEXT,
  description TEXT,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_slug) REFERENCES topics(slug)
)
`);

  db.run(`
CREATE TABLE IF NOT EXISTS user_group_topics (
  user_id INTEGER,
  group_id INTEGER,
  topic_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  PRIMARY KEY (user_id, group_id, topic_id)
)
`);

  console.log('Database schema updated successfully.');
});

// Close the database connection
db.close();
