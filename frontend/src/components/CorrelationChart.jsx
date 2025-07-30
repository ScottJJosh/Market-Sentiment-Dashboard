// src/components/CorrelationChart.jsx
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CorrelationChart = ({ data, title = "Sentiment vs Price Correlation" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-400">
          <p>No correlation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="sentiment" 
              stroke="#9CA3AF"
              label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -10 }}
              domain={[-1, 1]}
            />
            <YAxis 
              dataKey="price_change" 
              stroke="#9CA3AF"
              label={{ value: 'Price Change %', angle: -90, position: 'insideLeft' }}
            />
            <ReferenceLine x={0} stroke="#6B7280" strokeDasharray="2 2" />
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              formatter={(value, name) => [
                name === 'sentiment' ? value.toFixed(3) : `${value.toFixed(2)}%`,
                name === 'sentiment' ? 'Sentiment' : 'Price Change'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `Date: ${payload[0].payload.news_date}`;
                }
                return '';
              }}
            />
            <Scatter 
              dataKey="price_change" 
              fill="#3B82F6" 
              fillOpacity={0.7}
              stroke="#1E40AF"
              strokeWidth={1}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Correlation insights */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Data Points</p>
          <p className="text-lg font-bold">{data.length}</p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Positive Sentiment</p>
          <p className="text-lg font-bold text-green-400">
            {data.filter(d => d.sentiment > 0.1).length}
          </p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Negative Sentiment</p>
          <p className="text-lg font-bold text-red-400">
            {data.filter(d => d.sentiment < -0.1).length}
          </p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Neutral Sentiment</p>
          <p className="text-lg font-bold text-yellow-400">
            {data.filter(d => d.sentiment >= -0.1 && d.sentiment <= 0.1).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CorrelationChart;