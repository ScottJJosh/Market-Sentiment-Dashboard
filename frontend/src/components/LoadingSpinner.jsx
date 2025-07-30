import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-400`} />
      {text && <span className="text-slate-400">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
