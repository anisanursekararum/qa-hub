import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { LogOut, ChevronDown, FolderArchive } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string };
  onLogout: () => void;
  currentPath?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user, onLogout, currentPath = '/dashboard' }) => {
  const { activeProject, availableProjects, setActiveProject } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#121212] transition-colors duration-200">
      <Sidebar currentPath={currentPath} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="relative z-50 h-16 flex-shrink-0 flex items-center justify-between px-8 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] transition-colors duration-200">
          {/* Left side - Project Switcher */}
          <div className="flex items-center relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] px-3 py-1.5 rounded-[4px] hover:border-[#0F62FE] dark:hover:border-[#0F62FE] transition-colors min-w-[200px]"
            >
              <FolderArchive size={14} className="text-[#0F62FE]" />
              <div className="flex flex-col text-left flex-1 px-2">
                <span className="font-sans text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider font-semibold">Active Project</span>
                <span className="font-sans text-xs font-semibold text-[#161616] dark:text-white truncate">
                  {activeProject ? activeProject.name : 'Select a Project...'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-[#525252] dark:text-[#A8A8A8] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl z-50 py-1">
                  {availableProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 font-sans text-xs hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39] transition-colors ${
                        activeProject?.id === p.id ? 'text-[#0F62FE] font-bold bg-[#F4F4F4] dark:bg-[#2D2D39]' : 'text-[#161616] dark:text-[#E0E0E0]'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-5">
            <ThemeToggle />
            <button onClick={onLogout} className="text-[#525252] dark:text-[#A8A8A8] hover:text-[#DA1E28] dark:hover:text-[#DA1E28] transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
            <div className="flex flex-col text-right pl-4 border-l border-[#E0E0E0] dark:border-[#2D2D39]">
              <span className="font-sans font-semibold text-sm text-[#161616] dark:text-white leading-tight">
                {user.name}
              </span>
              <span className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D] leading-none mt-1">
                {user.email}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#121212] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};
