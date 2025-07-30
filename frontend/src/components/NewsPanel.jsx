// src/components/NewsPanel.jsx
import React from 'react';
import { ExternalLink, Calendar, User } from 'lucide-react';
import { getSentimentColor, getSentimentBgColor, formatSentimentScore } from '../utils/sentimentHelpers';

const NewsPanel = ({ articles, title = "Latest News" }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-400">
          <p>No news articles available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {articles.map((article, index) => (
          <div key={index} className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700/70 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm flex-1 leading-tight">{article.title}</h4>
              {article.sentiment_score !== undefined && (
                <div className={`ml-3 px-2 py-1 rounded text-xs ${getSentimentBgColor(article.sentiment_score)}`}>
                  {article.sentiment_classification || 'Unknown'}
                </div>
              )}
            </div>
            
            {article.description && (
              <p className="text-sm text-slate-300 mb-3 line-clamp-2">{article.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-4">
                {article.source && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {article.source}
                  </span>
                )}
                {(article.published_at || article.publishedAt) && (
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(article.published_at || article.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {article.sentiment_score !== undefined && (
                  <span className={`font-medium ${getSentimentColor(article.sentiment_score)}`}>
                    {formatSentimentScore(article.sentiment_score)}
                  </span>
                )}
                {article.url && (
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsPanel;