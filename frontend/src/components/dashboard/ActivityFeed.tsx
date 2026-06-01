import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ActivityFeedProps {
  activities: {
    id: string;
    title: string;
    description: string;
    time: string;
    user: string;
  }[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {

  return (
    <div className="bg-white dark:bg-[#121212] border border-[#E0E0E0] dark:border-none flex flex-col rounded-[4px]">
      <div className="space-y-0 divide-y divide-[#E0E0E0] dark:divide-[#2D2D39]">
        {activities.map((item) => (
          <div key={item.id} className="flex space-x-3 p-4 hover:bg-[#F7F7F7] dark:hover:bg-[#161616] transition-colors">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#0F62FE] text-white"><CheckCircle size={12} /></div>
            </div>
            <div className="flex-1">
              <p className="font-sans text-[11px] text-[#161616] dark:text-[#E0E0E0] leading-snug font-semibold">{item.title}</p>
              <p className="font-sans text-[11px] text-[#525252] dark:text-[#A8A8A8] mt-0.5">{item.description}</p>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className="font-mono text-[9px] text-[#757575] dark:text-[#8D8D8D]">
                  {new Date(item.time).toLocaleString()}
                </span>
                <span className="text-[#E0E0E0] dark:text-[#393939]">&bull;</span>
                <span className="font-mono text-[9px] text-[#757575] dark:text-[#8D8D8D]">{item.user}</span>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="p-4 text-center font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D]">
            No recent activity.
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <button className="w-full py-2 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] font-sans font-semibold text-[10px] text-[#0F62FE] dark:text-[#A8A8A8] hover:bg-[#F7F7F7] dark:hover:bg-[#1C1C21] transition-colors">
          View Full Audit Log
        </button>
      </div>
    </div>
  );
};
