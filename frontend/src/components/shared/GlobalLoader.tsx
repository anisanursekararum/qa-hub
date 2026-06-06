import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const GlobalLoader: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const handleStart = () => setActiveRequests((prev) => prev + 1);
    const handleEnd = () => setActiveRequests((prev) => Math.max(0, prev - 1));

    window.addEventListener('apiLoadStart', handleStart);
    window.addEventListener('apiLoadEnd', handleEnd);

    return () => {
      window.removeEventListener('apiLoadStart', handleStart);
      window.removeEventListener('apiLoadEnd', handleEnd);
    };
  }, []);

  if (activeRequests === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C21] p-6 rounded-lg shadow-2xl flex flex-col items-center space-y-4 border border-[#E0E0E0] dark:border-[#2D2D39]">
        <Loader2 className="w-10 h-10 text-[#0F62FE] animate-spin" />
        <p className="font-sans font-semibold text-sm text-[#161616] dark:text-white">
          Processing Request...
        </p>
        <p className="font-sans text-xs text-[#525252] dark:text-[#A8A8A8]">
          Please wait a moment.
        </p>
      </div>
    </div>
  );
};
