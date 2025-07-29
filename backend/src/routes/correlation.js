const express = require('express');
const axios = require('axios');
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/correlation/:symbol - Get sentiment-price correlation
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-correlation`, {
      symbol: symbol
    });
    
    res.json({
      success: true,
      symbol: symbol,
      data: response.data
    });
    
  } catch (error) {
    console.error('Correlation analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze correlation',
      details: error.message
    });
  }
});

module.exports = router;