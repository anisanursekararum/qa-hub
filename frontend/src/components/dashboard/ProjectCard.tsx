import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  status: 'Active' | 'In Progress';
  isAiEnabled?: boolean;
  users: number;
  updatedText: string;
  gradientFrom: string;
  gradientTo: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, status, isAiEnabled, users, updatedText, gradientFrom, gradientTo }) => {
  return (
    <div className="bg-[#F7F7F7] dark:bg-[#161616] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden flex flex-col transition-colors duration-200">
      {/* Visual Header / Cover */}
      <div className={`h-28 bg-gradient-to-br ${gradientFrom} ${gradientTo} relative overflow-hidden flex items-center justify-center`}>
         {/* Simulate the graphic from the screenshot */}
         <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]"></div>
         <div className="absolute top-2 right-2 flex space-x-1.5 z-10">
            {status === 'Active' && (
              <span className="bg-[#E0E0E0]/90 dark:bg-[#393939]/90 backdrop-blur text-[#161616] dark:text-[#E0E0E0] font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">
                Active
              </span>
            )}
            {status === 'In Progress' && (
              <span className="bg-[#0F62FE] text-white font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-[2px] shadow-sm">
                IN PROGRESS
              </span>
            )}
            {isAiEnabled && (
              <span className="bg-[#8A3FFC] text-white font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-[2px] shadow-sm">
                AI HEALING ACTIVE
              </span>
            )}
         </div>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col bg-white dark:bg-[#1C1C21]">
        <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white mb-2">{title}</h3>
        <p className="font-sans text-xs sm:text-sm text-[#525252] dark:text-[#A8A8A8] flex-1 leading-relaxed">{description}</p>
        
        <div className="mt-4 flex justify-between items-center border-t border-[#E0E0E0] dark:border-[#2D2D39] pt-3">
           <div className="flex items-center space-x-1">
             <span className="font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] bg-[#F4F4F4] dark:bg-[#2D2D39] px-2 py-1 rounded-[4px]">
               {users} Member{users !== 1 ? 's' : ''}
             </span>
           </div>
           <span className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D]">{updatedText}</span>
        </div>
      </div>
    </div>
  );
};
