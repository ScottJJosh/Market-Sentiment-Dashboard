// backend/src/routes/stocks.js
const express = require('express');
const router = express.Router();

// Available stocks list
const AVAILABLE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' }
];

// GET /api/stocks - List all available stocks
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: AVAILABLE_STOCKS,
      count: AVAILABLE_STOCKS.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stocks'
    });
  }
});

// GET /api/stocks/:symbol - Get specific stock info
router.get('/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = AVAILABLE_STOCKS.find(s => s.symbol === symbol);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: `Stock ${symbol} not found`
      });
    }
    
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock'
    });
  }
});

module.exports = router;