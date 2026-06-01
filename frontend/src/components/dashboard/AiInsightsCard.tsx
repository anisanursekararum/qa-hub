import React from 'react';
import { Sparkles, Play } from 'lucide-react';

export const AiInsightsCard: React.FC = () => {
  return (
    <div className="bg-[#1C1C21] dark:bg-[#1C1C21] border border-[#8A3FFC]/30 rounded-[4px] p-4 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#8A3FFC] rounded-full filter blur-[50px] opacity-20"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-1.5 mb-2.5">
           <Sparkles size={12} className="text-[#8A3FFC]" />
           <h3 className="font-mono text-[9px] font-bold text-[#8A3FFC] uppercase tracking-wider">AI Workspace Insights</h3>
        </div>
        
        <p className="font-sans text-[11px] text-[#E0E0E0] leading-relaxed mb-4">
          "I've identified that the 'Inventory_Service' tests fail 40% more often between 10 PM and midnight. This correlates with your nightly DB maintenance schedule. Consider rescheduling the suite for 1 AM."
        </p>
        
        <button className="w-full py-1.5 bg-[#8A3FFC] hover:bg-[#7733D9] text-white font-sans font-bold text-[10px] rounded-[4px] transition-colors shadow-sm">
          Apply Suggestion
        </button>
      </div>

      {/* Floating Action Button */}
      <div className="absolute -right-2 bottom-12 w-10 h-10 bg-[#0F62FE] rounded-l-[8px] flex items-center justify-center shadow-lg hover:bg-[#0353E9] cursor-pointer transition-transform group-hover:scale-105">
        <Play size={16} className="text-white ml-0.5" />
      </div>
    </div>
  );
};
