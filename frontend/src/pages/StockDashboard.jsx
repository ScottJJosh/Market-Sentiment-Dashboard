// src/pages/StockDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain, Newspaper, BarChart3, AlertCircle, RefreshCw, TestTube } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const StockDashboard = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [sentimentData, setSentimentData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [batchSentiment, setBatchSentiment] = useState(null);
  const [loading, setLoading] = useState({
    stocks: false,
    sentiment: false,
    correlation: false,
    news: false,
    batch: false
  });
  const [customText, setCustomText] = useState('');
  const [customSentiment, setCustomSentiment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch available stocks on component mount
  useEffect(() => {
    fetchStocks();
    fetchBatchSentiment();
  }, []);

  // Fetch data for selected stock when it changes
  useEffect(() => {
    if (selectedStock) {
      fetchSentimentData(selectedStock);
      fetchCorrelationData(selectedStock);
      fetchNewsData(selectedStock);
    }
  }, [selectedStock]);

  const fetchStocks = async () => {
    setLoading(prev => ({ ...prev, stocks: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/stocks`);
      const data = await response.json();
      if (data.success) {
        setStocks(data.data);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(prev => ({ ...prev, stocks: false }));
    }
  };

  const fetchSentimentData = async (symbol) => {
    setLoading(prev => ({ ...prev, sentiment: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setSentimentData(data.data);
      }
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      setSentimentData(null);
    } finally {
      setLoading(prev => ({ ...prev, sentiment: false }));
    }
  };

  const fetchCorrelationData = async (symbol) => {
    setLoading(prev => ({ ...prev, correlation: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/correlation/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setCorrelationData(data.data);
      }
    } catch (error) {
      console.error('Error fetching correlation:', error);
      setCorrelationData(null);
    } finally {
      setLoading(prev => ({ ...prev, correlation: false }));
    }
  };

  const fetchNewsData = async (symbol) => {
    setLoading(prev => ({ ...prev, news: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/news/${symbol}?count=20`);
      const data = await response.json();
      if (data.success) {
        setNewsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsData(null);
    } finally {
      setLoading(prev => ({ ...prev, news: false }));
    }
  };

  const fetchBatchSentiment = async () => {
    setLoading(prev => ({ ...prev, batch: true }));
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA'];
      const response = await fetch(`${API_BASE_URL}/sentiment/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, count: 25 })
      });
      const data = await response.json();
      if (data.success) {
        setBatchSentiment(data.data);
      }
    } catch (error) {
      console.error('Error fetching batch sentiment:', error);
    } finally {
      setLoading(prev => ({ ...prev, batch: false }));
    }
  };

  const analyzeCustomText = async () => {
    if (!customText.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText })
      });
      const data = await response.json();
      if (data.success) {
        setCustomSentiment(data.data);
      }
    } catch (error) {
      console.error('Error analyzing custom text:', error);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://localhost:8000/refresh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh all current data
        await Promise.all([
          fetchBatchSentiment(),
          fetchSentimentData(selectedStock),
          fetchCorrelationData(selectedStock),
          fetchNewsData(selectedStock)
        ]);
        
        setLastRefresh(new Date().toLocaleString());
        alert('Data refresh completed successfully!');
      } else {
        throw new Error(data.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert(`Refresh failed: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const getSentimentColor = (score) => {
    if (typeof score !== 'number') return 'text-slate-400';
    if (score > 0.1) return 'text-green-400';
    if (score < -0.1) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentBgColor = (score) => {
    if (typeof score !== 'number') return 'bg-slate-500/20 border-slate-500';
    if (score > 0.1) return 'bg-green-500/20 border-green-500';
    if (score < -0.1) return 'bg-red-500/20 border-red-500';
    return 'bg-yellow-500/20 border-yellow-500';
  };

  const formatSentimentScore = (score) => {
    return typeof score === 'number' ? score.toFixed(3) : 'N/A';
  };

  const formatPercentage = (value) => {
    return typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Stock Sentiment Intelligence
              </h1>
              <p className="text-slate-400">AI-powered sentiment analysis for market predictions</p>
            </div>
            
            {/* Button Group */}
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
              
              <button
                onClick={() => navigate('/playground')}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                <TestTube className="w-4 h-4" />
                <span>Sentiment Lab</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {lastRefresh && (
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-400 bg-slate-800/30 rounded-lg py-2 px-4 inline-block">
              📊 Last data refresh: {lastRefresh}
            </p>
          </div>
        )}

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Tracked Stocks</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stocks.length}</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Articles Analyzed</h3>
              <Newspaper className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {sentimentData?.articles_analyzed || 0}
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Current Sentiment</h3>
              <Brain className="w-5 h-5 text-green-400" />
            </div>
            <p className={`text-2xl font-bold ${getSentimentColor(sentimentData?.overall_sentiment?.score)}`}>
              {sentimentData?.overall_sentiment?.classification?.toUpperCase() || 'LOADING'}
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Correlation Points</h3>
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {correlationData?.correlation_data?.length || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analysis Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Selection */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Stock Analysis</h3>
                <button
                  onClick={() => {
                    fetchSentimentData(selectedStock);
                    fetchCorrelationData(selectedStock);
                    fetchNewsData(selectedStock);
                  }}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stocks.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock.symbol)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedStock === stock.symbol
                        ? 'bg-blue-600/20 border border-blue-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sentiment Analysis Results */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Sentiment Analysis - {selectedStock}</h3>
              
              {loading.sentiment ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Analyzing sentiment...</span>
                </div>
              ) : sentimentData ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getSentimentBgColor(sentimentData.overall_sentiment?.score)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Overall Sentiment</p>
                        <p className="text-2xl font-bold">{sentimentData.overall_sentiment?.classification?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Score</p>
                        <p className={`text-2xl font-bold ${getSentimentColor(sentimentData.overall_sentiment?.score)}`}>
                          {formatSentimentScore(sentimentData.overall_sentiment?.score)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400">Articles Found</p>
                      <p className="text-xl font-bold">{sentimentData.articles_analyzed || 0}</p>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400">Symbol</p>
                      <p className="text-xl font-bold">{sentimentData.symbol || selectedStock}</p>
                    </div>
                  </div>

                  {/* Recent Articles Sample */}
                  {sentimentData.articles && sentimentData.articles.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Recent Articles</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {sentimentData.articles.map((article, index) => (
                          <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{article.title}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div className="ml-4 text-right">
                                <span className={`px-2 py-1 text-xs rounded ${getSentimentBgColor(article.sentiment_score)}`}>
                                  {article.sentiment_classification || 'Unknown'}
                                </span>
                                <p className={`text-sm font-medium mt-1 ${getSentimentColor(article.sentiment_score)}`}>
                                  {formatSentimentScore(article.sentiment_score)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No sentiment data available</p>
                </div>
              )}
            </div>

            {/* Correlation Analysis */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Sentiment-Price Correlation</h3>
              
              {loading.correlation ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Analyzing correlation...</span>
                </div>
              ) : correlationData?.correlation_data && correlationData.correlation_data.length > 0 ? (
                <div className="space-y-4">
                  {correlationData.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Total Correlations</p>
                        <p className="text-lg font-bold">{correlationData.summary.total_correlations || 0}</p>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Positive Days</p>
                        <p className="text-lg font-bold text-green-400">{correlationData.summary.positive_sentiment_days || 0}</p>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Negative Days</p>
                        <p className="text-lg font-bold text-red-400">{correlationData.summary.negative_sentiment_days || 0}</p>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Avg +Price Change</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatPercentage(correlationData.summary.avg_positive_price_change)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={correlationData.correlation_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="sentiment" 
                          stroke="#9CA3AF"
                          label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="price_change" 
                          stroke="#9CA3AF"
                          label={{ value: 'Price Change %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          formatter={(value, name) => [
                            name === 'sentiment' ? formatSentimentScore(value) : formatPercentage(value),
                            name === 'sentiment' ? 'Sentiment' : 'Price Change'
                          ]}
                        />
                        <Scatter dataKey="price_change" fill="#3B82F6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>No correlation data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Custom Text Analysis */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Custom Text Analysis</h3>
              
              <div className="space-y-4">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter text to analyze sentiment..."
                  className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={analyzeCustomText}
                  disabled={!customText.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Analyze Sentiment
                </button>

                {customSentiment && (
                  <div className={`p-4 rounded-lg border ${getSentimentBgColor(customSentiment.sentiment?.combined_score)}`}>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Classification</p>
                      <p className="text-lg font-bold mb-2">
                        {customSentiment.sentiment?.classification?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-400">Score</p>
                      <p className={`text-xl font-bold ${getSentimentColor(customSentiment.sentiment?.combined_score)}`}>
                        {formatSentimentScore(customSentiment.sentiment?.combined_score)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Market Sentiment Overview */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Market Overview</h3>
                <button
                  onClick={fetchBatchSentiment}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              {loading.batch ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : batchSentiment?.results ? (
                <div className="space-y-3">
                  {Object.entries(batchSentiment.results).map(([symbol, data]) => (
                    <div 
                      key={symbol}
                      onClick={() => setSelectedStock(symbol)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedStock === symbol ? 'bg-blue-600/20 border border-blue-500' : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{symbol}</p>
                          <p className="text-xs text-slate-400">
                            {data.articles_found || 0} articles
                          </p>
                        </div>
                        {data.overall_sentiment ? (
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded ${getSentimentBgColor(data.overall_sentiment.score)}`}>
                              {data.overall_sentiment.classification || 'neutral'}
                            </span>
                            <p className={`text-sm font-medium mt-1 ${getSentimentColor(data.overall_sentiment.score)}`}>
                              {formatSentimentScore(data.overall_sentiment.score)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">No data</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No market data available</p>
                </div>
              )}
            </div>

            {/* Latest News */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Latest News - {selectedStock}</h3>
              
              {loading.news ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : newsData?.articles && newsData.articles.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {newsData.articles.slice(0, 5).map((article, index) => (
                    <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="font-medium text-sm mb-1">{article.title}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">{article.source || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Newspaper className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No news available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;