// server.js
// A simple Express.js backend for a Todo list API using SQLite

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve index.html as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files from /public under /static route
app.use('/static', express.static(path.join(__dirname, 'public'), {
  index: false,
  dotfiles: 'ignore'
}));

// Connect to SQLite database
const db = new sqlite3.Database('./todo.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create 'todos' table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  priority TEXT DEFAULT 'low',
  isComplete BOOLEAN DEFAULT 0,
  isFun BOOLEAN DEFAULT 0
)`);

// GET all todo items
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = false } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, 0, ?)',
    [name, priority, isFun],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        priority,
        isComplete: false,
        isFun
      });
    }
  );
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Todo item not found' });
    }
    res.json({ message: `Todo item ${id} deleted.` });
  });
});

// Catch-all route to serve index.html for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/todos') && !req.path.startsWith('/static')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} :)`);
});
