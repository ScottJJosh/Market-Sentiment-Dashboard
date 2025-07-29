const express = require('express');
const axios = require('axios');
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/news/:symbol - Get filtered news for a stock
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const count = req.query.count || 50;
    
    const response = await axios.post(`${ML_SERVICE_URL}/get-news`, {
      symbol: symbol,
      count: parseInt(count)
    });
    
    res.json({
      success: true,
      symbol: symbol,
      data: response.data
    });
    
  } catch (error) {
    console.error('News fetch error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      details: error.message
    });
  }
});

module.exports = router;