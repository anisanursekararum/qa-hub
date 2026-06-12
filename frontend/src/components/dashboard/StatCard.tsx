import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  colorName?: 'blue' | 'purple' | 'red' | 'green'; 
  description?: string;
}

const styles = {
  blue: { bg: 'bg-[#0F62FE]', hoverBorder: 'hover:border-[#0F62FE] dark:hover:border-[#0F62FE]', hoverText: 'group-hover:text-[#0F62FE]' },
  purple: { bg: 'bg-[#8A3FFC]', hoverBorder: 'hover:border-[#8A3FFC] dark:hover:border-[#8A3FFC]', hoverText: 'group-hover:text-[#8A3FFC]' },
  red: { bg: 'bg-[#DA1E28]', hoverBorder: 'hover:border-[#DA1E28] dark:hover:border-[#DA1E28]', hoverText: 'group-hover:text-[#DA1E28]' },
  green: { bg: 'bg-[#24A148]', hoverBorder: 'hover:border-[#24A148] dark:hover:border-[#24A148]', hoverText: 'group-hover:text-[#24A148]' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, colorName, description }) => {
  const theme = colorName ? styles[colorName] : null;

  return (
    <div className={`relative bg-[#F7F7F7] dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-5 overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-200 cursor-pointer group ${theme ? theme.hoverBorder : 'hover:border-[#0F62FE] dark:hover:border-[#0F62FE]'}`}>
      {theme && <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg}`}></div>}
      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex-1 pr-4">
          <h3 className={`font-mono text-sm font-bold text-[#525252] dark:text-[#8D8D8D] uppercase tracking-wider transition-colors ${theme ? theme.hoverText : 'group-hover:text-[#0F62FE]'}`}>{title}</h3>
          {description && <p className="font-sans text-xs text-[#757575] dark:text-[#8D8D8D] mt-1 leading-normal">{description}</p>}
        </div>
        {icon && <div className="text-[#525252] dark:text-[#A8A8A8] group-hover:scale-110 transition-transform duration-200">{icon}</div>}
      </div>
      <div className="pl-2 flex items-end space-x-3">
        <p className="font-sans font-bold text-4xl text-[#161616] dark:text-white leading-none tracking-tight">{value}</p>
        {subtitle && <div className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D] pb-1 w-full">{subtitle}</div>}
      </div>
    </div>
  );
};
