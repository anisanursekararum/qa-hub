import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  borderColor?: string; 
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, borderColor }) => {
  return (
    <div className="relative bg-[#F7F7F7] dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-5 overflow-hidden flex flex-col justify-between min-h-[110px] transition-colors duration-200">
      {borderColor && <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`}></div>}
      <div className="flex justify-between items-start mb-2 pl-2">
        <h3 className="font-mono text-[9px] font-bold text-[#525252] dark:text-[#8D8D8D] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="pl-2 flex items-end space-x-3">
        <p className="font-sans font-bold text-3xl text-[#161616] dark:text-white leading-none tracking-tight">{value}</p>
        {subtitle && <div className="font-mono text-[9px] text-[#757575] dark:text-[#8D8D8D] pb-1">{subtitle}</div>}
      </div>
    </div>
  );
};
