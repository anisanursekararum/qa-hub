import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActivityFeedProps {
  activities: {
    id: string;
    title: string;
    description: string;
    time: string;
    user: string;
    type?: string;
    linkId?: string;
  }[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const navigate = useNavigate();

  const displayedActivities = activities.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-[#E0E0E0] dark:border-none flex flex-col rounded-[4px]">
      <div className="space-y-0 divide-y divide-[#E0E0E0] dark:divide-[#2D2D39]">
        {displayedActivities.map((item) => (
          <div 
            key={item.id} 
            className="flex space-x-3 p-4 hover:bg-[#F7F7F7] dark:hover:bg-[#161616] transition-colors cursor-pointer"
            onClick={() => {
              if (item.type === 'TEST_RUN' && item.linkId) {
                navigate(`/runs/${item.linkId}`);
              } else if (item.type === 'TEST_CASE' && item.linkId) {
                navigate(`/repository?search=${item.linkId}`);
              }
            }}
          >
            <div className="flex-shrink-0 pt-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#0F62FE] text-white"><CheckCircle size={12} /></div>
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm text-[#161616] dark:text-[#E0E0E0] leading-snug font-semibold">{item.title}</p>
              <p className="font-sans text-xs sm:text-sm text-[#525252] dark:text-[#A8A8A8] mt-0.5">{item.description}</p>
              <div className="flex items-center space-x-1.5 mt-2">
                <span className="font-mono text-[10px] sm:text-xs text-[#757575] dark:text-[#8D8D8D]">
                  {new Date(item.time).toLocaleString()}
                </span>
                <span className="text-[#E0E0E0] dark:text-[#393939]">&bull;</span>
                <span className="font-mono text-[10px] sm:text-xs text-[#757575] dark:text-[#8D8D8D]">{item.user}</span>
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
        {visibleCount < activities.length ? (
          <button 
            onClick={handleLoadMore}
            className="w-full py-2 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] font-sans font-semibold text-xs text-[#0F62FE] dark:text-[#A8A8A8] hover:bg-[#F7F7F7] dark:hover:bg-[#1C1C21] transition-colors"
          >
            Load More
          </button>
        ) : (
          <div className="w-full py-2 text-center font-sans text-xs text-[#757575] dark:text-[#8D8D8D]">
            audit log 1 hari ini sudah ditampilkan
          </div>
        )}
      </div>
    </div>
  );
};
