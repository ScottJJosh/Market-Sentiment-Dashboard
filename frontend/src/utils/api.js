// src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },
};

// Stock-specific API calls
export const stockAPI = {
  getStocks: () => apiClient.get('/stocks'),
  getStock: (symbol) => apiClient.get(`/stocks/${symbol}`),
};

// Sentiment-specific API calls
export const sentimentAPI = {
  analyzeSentiment: (symbol) => apiClient.get(`/sentiment/${symbol}`),
  analyzeText: (text) => apiClient.post('/sentiment/analyze', { text }),
  analyzeBatch: (symbols, count = 25) => apiClient.post('/sentiment/batch', { symbols, count }),
};

// Correlation-specific API calls
export const correlationAPI = {
  analyze: (symbol) => apiClient.get(`/correlation/${symbol}`),
};

// News-specific API calls
export const newsAPI = {
  getNews: (symbol, count = 50) => apiClient.get(`/news/${symbol}?count=${count}`),
};