// src/hooks/useNews.js
import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useNews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNews = async (symbol, count = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/news/${symbol}?count=${count}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchNews
  };
};