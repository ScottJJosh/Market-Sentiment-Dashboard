const express = require('express');
const axios = require('axios');
const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/sentiment/:symbol - Get sentiment analysis for a stock
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Call your Python ML service
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
      symbol: symbol,
      count: 50  // Number of articles to analyze
    });
    
    res.json({
      success: true,
      symbol: symbol,
      data: response.data
    });
    
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      details: error.message
    });
  }
});

// POST /api/sentiment/analyze - Analyze custom text
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    // Call your Python sentiment analysis
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-text`, {
      text: text
    });
    
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Text analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text'
    });
  }
});

// POST /api/sentiment/batch - Analyze multiple stocks
router.post('/batch', async (req, res) => {
  try {
    const { symbols, count = 25 } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required'
      });
    }
    
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-batch`, {
      symbols: symbols,
      count: count
    });
    
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze batch'
    });
  }
});


module.exports = router;