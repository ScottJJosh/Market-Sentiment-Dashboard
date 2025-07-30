// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StockDashboard from './pages/StockDashboard';
import StockDetail from './pages/StockDetail';
import SentimentPlayground from './pages/SentimentPlayground';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<StockDashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/playground" element={<SentimentPlayground />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;