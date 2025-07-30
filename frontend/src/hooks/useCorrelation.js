// src/hooks/useCorrelation.js
import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useCorrelation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeCorrelation = async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/correlation/${symbol}`);
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
    analyzeCorrelation
  };
};