// src/components/StockCard.jsx
import React from 'react';
import { Activity } from 'lucide-react';
import { getSentimentColor, getSentimentBgColor, formatSentimentScore } from '../utils/sentimentHelpers';

const StockCard = ({ stock, sentimentData, onClick, isSelected }) => {
  const hasData = sentimentData && sentimentData.overall_sentiment;
  
  return (
    <div 
      onClick={() => onClick(stock.symbol)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-600/20 border-2 border-blue-500 transform scale-105' 
          : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold">{stock.symbol}</h3>
          <p className="text-sm text-slate-400 truncate">{stock.name}</p>
        </div>
        <Activity className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
      </div>
      
      {hasData ? (
        <div className={`p-3 rounded-lg ${getSentimentBgColor(sentimentData.overall_sentiment.score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300">Sentiment</p>
              <p className="font-semibold">{sentimentData.overall_sentiment.classification.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300">Score</p>
              <p className={`font-bold ${getSentimentColor(sentimentData.overall_sentiment.score)}`}>
                {formatSentimentScore(sentimentData.overall_sentiment.score)}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            {sentimentData.articles_analyzed} articles analyzed
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">Loading sentiment...</p>
        </div>
      )}
    </div>
  );
};

export default StockCard;