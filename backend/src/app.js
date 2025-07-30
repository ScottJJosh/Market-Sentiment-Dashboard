const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stock Playground API is running!',
    version: '1.0.0',
    description: 'AI-powered sentiment analysis for stock market predictions'
  });
});

// API routes
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/sentiment', require('./routes/sentiment'));
app.use('/api/correlation', require('./routes/correlation'));
app.use('/api/news', require('./routes/news'));

app.listen(PORT, () => {
  console.log(`Stock Playground API server running on port ${PORT}`);
});

module.exports = app;