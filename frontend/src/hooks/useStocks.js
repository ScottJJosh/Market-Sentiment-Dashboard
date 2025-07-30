// src/hooks/useStocks.js
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/stocks`);
      const data = await response.json();
      if (data.success) {
        setStocks(data.data);
      } else {
        setError('Failed to fetch stocks');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStock = async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/${symbol}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching stock:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  return {
    stocks,
    loading,
    error,
    fetchStocks,
    getStock
  };
};