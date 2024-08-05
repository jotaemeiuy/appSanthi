// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db'); // Archivo persistente

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL
  )`);
});

module.exports = db;
