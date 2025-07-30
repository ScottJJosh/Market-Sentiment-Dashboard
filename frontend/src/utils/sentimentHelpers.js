// src/utils/sentimentHelpers.js
export const getSentimentColor = (score) => {
  if (score > 0.1) return 'text-green-400';
  if (score < -0.1) return 'text-red-400';
  return 'text-yellow-400';
};

export const getSentimentBgColor = (score) => {
  if (score > 0.1) return 'bg-green-500/20 border-green-500';
  if (score < -0.1) return 'bg-red-500/20 border-red-500';
  return 'bg-yellow-500/20 border-yellow-500';
};

export const formatSentimentScore = (score) => {
  return typeof score === 'number' ? score.toFixed(3) : 'N/A';
};

export const getSentimentIcon = (score) => {
  if (score > 0.1) return '📈';
  if (score < -0.1) return '📉';
  return '➡️';
};

export const formatPercentage = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};