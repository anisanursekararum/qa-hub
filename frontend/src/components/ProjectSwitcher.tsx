import React, { useState } from 'react';
import { FolderArchive, ChevronDown } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export const ProjectSwitcher: React.FC = () => {
  const { activeProject, availableProjects, setActiveProject } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex w-full items-center justify-between space-x-2 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] px-4 py-2 rounded-[4px] hover:border-[#0F62FE] dark:hover:border-[#0F62FE] transition-colors min-w-[240px]"
      >
        <div className="flex items-center space-x-3">
          <FolderArchive size={16} className="text-[#0F62FE]" />
          <div className="flex flex-col text-left">
            <span className="font-sans text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider font-semibold">Active Project</span>
            <span className="font-sans text-sm font-semibold text-[#161616] dark:text-white truncate">
              {activeProject ? activeProject.name : 'Select a Project...'}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-[#525252] dark:text-[#A8A8A8] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          ></div>
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
            {availableProjects.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProject(p);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 font-sans text-sm hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39] transition-colors ${
                  activeProject?.id === p.id ? 'text-[#0F62FE] font-bold bg-[#F4F4F4] dark:bg-[#2D2D39]' : 'text-[#161616] dark:text-[#E0E0E0]'
                }`}
              >
                {p.name}
              </button>
            ))}
            {availableProjects.length === 0 && (
              <div className="px-4 py-2 font-sans text-xs text-[#757575] dark:text-[#8D8D8D]">
                No active projects found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
