// src/pages/SentimentPlayground.jsx
import React, { useState } from 'react';
import { Brain, Zap, TestTube, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSentimentColor, getSentimentBgColor, formatSentimentScore } from '../utils/sentimentHelpers';

const SentimentPlayground = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [batchTexts, setBatchTexts] = useState(['', '', '']);
  const [batchResults, setBatchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);

  const predefinedTexts = [
    "Apple's new iPhone is revolutionary and will change the smartphone market forever!",
    "Tesla stock plummets after disappointing earnings report and production delays.",
    "Microsoft's cloud revenue grew 25% this quarter, beating analyst expectations.",
    "Meta faces regulatory challenges but shows strong user growth in emerging markets.",
    "Google's AI advancements position them well for the future of technology.",
    "Amazon's logistics network continues to face supply chain disruptions."
  ];

  const analyzeCustomText = async (text) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error analyzing text:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAnalysis = async () => {
    if (!inputText.trim()) return;
    
    const result = await analyzeCustomText(inputText);
    if (result) {
      const newAnalysis = {
        id: Date.now(),
        text: inputText,
        result: result.sentiment,
        timestamp: new Date().toLocaleString()
      };
      
      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 9)]);
      setInputText('');
    }
  };

  const handleBatchAnalysis = async () => {
    const validTexts = batchTexts.filter(text => text.trim());
    if (validTexts.length === 0) return;
    
    const results = [];
    for (const text of validTexts) {
      const result = await analyzeCustomText(text);
      if (result) {
        results.push({
          text,
          result: result.sentiment
        });
      }
    }
    
    setBatchResults(results);
  };

  const loadPredefinedText = (text) => {
    setInputText(text);
  };

  const addBatchInput = () => {
    setBatchTexts(prev => [...prev, '']);
  };

  const removeBatchInput = (index) => {
    setBatchTexts(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchText = (index, value) => {
    setBatchTexts(prev => prev.map((text, i) => i === index ? value : text));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Sentiment Playground
            </h1>
          </div>
          <p className="text-slate-400">Experiment with AI-powered sentiment analysis using VADER + TextBlob models</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'single' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>Single Analysis</span>
          </button>
          
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'batch' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Batch Analysis</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analysis Panel */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'single' ? (
              <>
                {/* Single Text Analysis */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Text Analysis</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Enter text to analyze
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type or paste any text here to analyze its sentiment..."
                        className="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        {inputText.length} characters
                      </span>
                      <button
                        onClick={handleSingleAnalysis}
                        disabled={!inputText.trim() || loading}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis History */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Analysis History</h3>
                  
                  {analysisHistory.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {analysisHistory.map((analysis) => (
                        <div key={analysis.id} className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="mb-3">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              "{analysis.text}"
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`px-3 py-1 rounded-lg border ${getSentimentBgColor(analysis.result.combined_score)}`}>
                                <span className="text-sm font-medium">
                                  {analysis.result.classification.toUpperCase()}
                                </span>
                              </div>
                              <span className={`font-bold ${getSentimentColor(analysis.result.combined_score)}`}>
                                {formatSentimentScore(analysis.result.combined_score)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {analysis.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No analysis history yet</p>
                      <p className="text-sm">Start analyzing text to see results here</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Batch Analysis */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Batch Analysis</h3>
                    <button
                      onClick={addBatchInput}
                      className="text-sm bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-lg transition-colors"
                    >
                      Add Input
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {batchTexts.map((text, index) => (
                      <div key={index} className="flex space-x-2">
                        <textarea
                          value={text}
                          onChange={(e) => updateBatchText(index, e.target.value)}
                          placeholder={`Text ${index + 1}...`}
                          className="flex-1 h-20 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {batchTexts.length > 1 && (
                          <button
                            onClick={() => removeBatchInput(index)}
                            className="text-red-400 hover:text-red-300 px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={handleBatchAnalysis}
                      disabled={loading || batchTexts.every(text => !text.trim())}
                      className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{loading ? 'Analyzing...' : 'Analyze All'}</span>
                    </button>
                  </div>
                </div>

                {/* Batch Results */}
                {batchResults.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Batch Results</h3>
                    
                    <div className="space-y-4">
                      {batchResults.map((result, index) => (
                        <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="mb-3">
                            <p className="text-sm text-slate-300">
                              "{result.text}"
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-lg border ${getSentimentBgColor(result.result.combined_score)}`}>
                              <span className="text-sm font-medium">
                                {result.result.classification.toUpperCase()}
                              </span>
                            </div>
                            <span className={`font-bold ${getSentimentColor(result.result.combined_score)}`}>
                              {formatSentimentScore(result.result.combined_score)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sample Texts */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Sample Texts</h3>
              <p className="text-sm text-slate-400 mb-4">
                Click to try these examples
              </p>
              
              <div className="space-y-2">
                {predefinedTexts.map((text, index) => (
                  <button
                    key={index}
                    onClick={() => loadPredefinedText(text)}
                    className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-purple-400 mb-2">VADER Sentiment</h4>
                  <p className="text-sm text-slate-300">
                    Specialized for social media text with emoticons, slang, and intensifiers
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-400 mb-2">TextBlob</h4>
                  <p className="text-sm text-slate-300">
                    Traditional NLP approach using machine learning trained on movie reviews
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-400 mb-2">Combined Score</h4>
                  <p className="text-sm text-slate-300">
                    Weighted average of both models for more accurate predictions
                  </p>
                </div>
              </div>
            </div>

            {/* Score Reference */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Score Reference</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Positive</span>
                  <span className="text-sm text-slate-400">&gt; 0.1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Neutral</span>
                  <span className="text-sm text-slate-400">-0.1 to 0.1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Negative</span>
                  <span className="text-sm text-slate-400">&lt; -0.1</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-xs text-slate-400">
                  Scores range from -1.0 (most negative) to +1.0 (most positive)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentPlayground;