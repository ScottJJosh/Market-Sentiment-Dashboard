// src/pages/StockDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, TrendingUp } from 'lucide-react';
import SentimentChart from '../components/SentimentChart';
import NewsPanel from '../components/NewsPanel';
import CorrelationChart from '../components/CorrelationChart';
import { getSentimentColor, getSentimentBgColor, formatSentimentScore } from '../utils/sentimentHelpers';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stockInfo, setStockInfo] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState({
    sentiment: false,
    correlation: false,
    news: false
  });

  useEffect(() => {
    if (symbol) {
      loadStockData();
    }
  }, [symbol, timeframe]);

  const loadStockData = async () => {
    // Load stock info
    try {
      const response = await fetch(`http://localhost:5000/api/stocks/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setStockInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading stock info:', error);
    }

    // Load sentiment data
    setLoading(prev => ({ ...prev, sentiment: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/sentiment/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setSentimentData(data.data);
      }
    } catch (error) {
      console.error('Error loading sentiment:', error);
    } finally {
      setLoading(prev => ({ ...prev, sentiment: false }));
    }

    // Load correlation data
    setLoading(prev => ({ ...prev, correlation: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/correlation/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setCorrelationData(data.data);
      }
    } catch (error) {
      console.error('Error loading correlation:', error);
    } finally {
      setLoading(prev => ({ ...prev, correlation: false }));
    }

    // Load news data
    setLoading(prev => ({ ...prev, news: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/news/${symbol}?count=30`);
      const data = await response.json();
      if (data.success) {
        setNewsData(data.data);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(prev => ({ ...prev, news: false }));
    }
  };

  const handleRefresh = () => {
    loadStockData();
  };

  const handleExport = () => {
    const exportData = {
      symbol,
      timestamp: new Date().toISOString(),
      sentiment: sentimentData,
      correlation: correlationData,
      news: newsData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="text-center py-20">
          <p className="text-xl text-slate-400">No stock symbol provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading.sentiment || loading.correlation || loading.news}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${(loading.sentiment || loading.correlation || loading.news) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold">{symbol}</h1>
            {stockInfo && (
              <div>
                <p className="text-xl text-slate-300">{stockInfo.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Overall Sentiment</h3>
            {sentimentData?.overall_sentiment ? (
              <div>
                <p className={`text-2xl font-bold ${getSentimentColor(sentimentData.overall_sentiment.score)}`}>
                  {sentimentData.overall_sentiment.classification.toUpperCase()}
                </p>
                <p className="text-sm text-slate-400">
                  Score: {formatSentimentScore(sentimentData.overall_sentiment.score)}
                </p>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-8 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-20"></div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Articles Analyzed</h3>
            <p className="text-2xl font-bold">{sentimentData?.articles_analyzed || 0}</p>
            <p className="text-sm text-slate-400">Recent news coverage</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Correlation Points</h3>
            <p className="text-2xl font-bold">{correlationData?.correlation_data?.length || 0}</p>
            <p className="text-sm text-slate-400">Sentiment-price pairs</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Prediction Confidence</h3>
            {correlationData?.summary ? (
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((correlationData.summary.total_correlations / 30) * 100)}%
                </p>
                <p className="text-sm text-slate-400">Data coverage</p>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-8 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-16"></div>
              </div>
            )}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Timeframe:</span>
            {['1d', '7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Analysis */}
          <div className="space-y-6">
            {/* Sentiment Overview */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Sentiment Analysis</h3>
              
              {loading.sentiment ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-slate-700 rounded-lg"></div>
                  <div className="h-32 bg-slate-700 rounded-lg"></div>
                </div>
              ) : sentimentData ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getSentimentBgColor(sentimentData.overall_sentiment?.score || 0)}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-300">Classification</p>
                        <p className="text-xl font-bold">
                          {sentimentData.overall_sentiment?.classification?.toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">Confidence Score</p>
                        <p className={`text-xl font-bold ${getSentimentColor(sentimentData.overall_sentiment?.score || 0)}`}>
                          {formatSentimentScore(sentimentData.overall_sentiment?.score)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Articles Preview */}
                  {sentimentData.articles && sentimentData.articles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recent Analysis</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {sentimentData.articles.slice(0, 3).map((article, index) => (
                          <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate flex-1">
                                {article.title}
                              </p>
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${getSentimentBgColor(article.sentiment_score)}`}>
                                {formatSentimentScore(article.sentiment_score)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No sentiment data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Correlation Analysis */}
          <div>
            <CorrelationChart 
              data={correlationData?.correlation_data} 
              title={`Sentiment vs Price Correlation - ${symbol}`}
            />
          </div>
        </div>

        {/* News Section */}
        <div className="mb-8">
          <NewsPanel 
            articles={newsData?.articles} 
            title={`Latest News for ${symbol}`}
          />
        </div>

        {/* Additional Insights */}
        {correlationData?.summary && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Market Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-green-400">Positive Sentiment Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Days with positive sentiment:</span>
                    <span className="font-medium">{correlationData.summary.positive_sentiment_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average price change:</span>
                    <span className={`font-medium ${correlationData.summary.avg_positive_price_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {correlationData.summary.avg_positive_price_change?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-red-400">Negative Sentiment Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Days with negative sentiment:</span>
                    <span className="font-medium">{correlationData.summary.negative_sentiment_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average price change:</span>
                    <span className={`font-medium ${correlationData.summary.avg_negative_price_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {correlationData.summary.avg_negative_price_change?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetail;