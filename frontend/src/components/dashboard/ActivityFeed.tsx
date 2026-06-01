import React from 'react';
import { Bug, Sparkles, CheckCircle, UserPlus, AlertTriangle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'bug' | 'ai' | 'success' | 'user' | 'alert';
  title: React.ReactNode;
  time: string;
  meta?: string;
}

export const ActivityFeed: React.FC = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'success',
      title: <>Test Result: <strong>Fintech_API_v4</strong> passed all 124 benchmarks.</>,
      time: '2 minutes ago',
      meta: 'Automated Run'
    },
    {
      id: '2',
      type: 'ai',
      title: <>AI Action: Healed selector flakiness in <strong>'Login_Suite'</strong>.</>,
      time: '15 minutes ago',
      meta: 'AI Engine'
    },
    {
      id: '3',
      type: 'user',
      title: <>Member Joined: <strong>Sarah Jenkins</strong> added to Mobile App V3.</>,
      time: '1 hour ago',
      meta: 'Admin Action'
    },
    {
      id: '4',
      type: 'alert',
      title: <>New Issue: Critical latency detected in <strong>DB_CLUSTER_B</strong>.</>,
      time: '3 hours ago',
      meta: 'Monitoring'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'bug': return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FFF1F1] text-[#DA1E28]"><Bug size={12} /></div>;
      case 'ai': return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#8A3FFC] text-white"><Sparkles size={12} /></div>;
      case 'success': return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#0F62FE] text-white"><CheckCircle size={12} /></div>;
      case 'user': return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F4F4F4] dark:bg-[#393939] text-[#161616] dark:text-white"><UserPlus size={12} /></div>;
      case 'alert': return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FFF1F1] dark:bg-[#2D161A] text-[#DA1E28]"><AlertTriangle size={12} /></div>;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-[#E0E0E0] dark:border-none flex flex-col rounded-[4px]">
      <div className="space-y-0 divide-y divide-[#E0E0E0] dark:divide-[#2D2D39]">
        {activities.map((item) => (
          <div key={item.id} className="flex space-x-3 p-4 hover:bg-[#F7F7F7] dark:hover:bg-[#161616] transition-colors">
            <div className="flex-shrink-0">
              {getIcon(item.type)}
            </div>
            <div className="flex-1">
              <p className="font-sans text-[11px] text-[#161616] dark:text-[#E0E0E0] leading-snug">{item.title}</p>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className="font-mono text-[9px] text-[#757575] dark:text-[#8D8D8D]">{item.time}</span>
                {item.meta && (
                  <>
                    <span className="text-[#E0E0E0] dark:text-[#393939]">&bull;</span>
                    <span className="font-mono text-[9px] text-[#757575] dark:text-[#8D8D8D]">{item.meta}</span>
                  </>
                )}
              </div>
              {item.type === 'ai' && (
                 <button className="font-sans text-[9px] font-semibold text-[#8A3FFC] mt-1.5 hover:underline focus:outline-none">View Diff &rarr;</button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <button className="w-full py-2 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] font-sans font-semibold text-[10px] text-[#0F62FE] dark:text-[#A8A8A8] hover:bg-[#F7F7F7] dark:hover:bg-[#1C1C21] transition-colors">
          View Full Audit Log
        </button>
      </div>
    </div>
  );
};
