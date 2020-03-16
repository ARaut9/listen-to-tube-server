const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.get('/search', (req, res) => {
  res.json({ name: 'result 1' });
});

app.get('/video', (req, res) => {
  res.json({ name: 'video name' });
});

app.get('/playlist', (req, res) => {
  res.json({ name: 'playlist name' });
});

// unknown endpoint handler
app.use((req, res, next) => {
  const err = new Error('404 Not Found!');
  err.status = 404;
  next(err);
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500);
  res.json({
    err: {
      message: err.message,
    },
  });
});

module.exports = app;
