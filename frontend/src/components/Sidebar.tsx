import React from 'react';
import { LayoutDashboard, FolderKanban, Library, PlayCircle, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const isLinkActive = (path: string) => currentPath === path;

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col justify-between border-r border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] h-screen sticky top-0 transition-colors duration-200">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-[#E0E0E0] dark:border-[#2D2D39]">
          <a href="/" className="flex items-center space-x-2.5 focus:outline-none">
            <div className="w-10 h-10 rounded-[4px] bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/qa-hub-logo.png" alt="QA-Hub Logo" className="w-full h-full object-cover scale-[1.35]" />
            </div>
            <span className="font-sans font-black text-xl tracking-tight">
              <span className="text-[#0F62FE]">QA</span><span className="text-[#8A3FFC]">-Hub</span>
            </span>
          </a>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          <a href="/dashboard" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/dashboard') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <LayoutDashboard size={16} className={isLinkActive('/dashboard') ? 'text-white' : 'text-[#0F62FE]'} />
            <span>Dashboard</span>
          </a>
          <a href="/projects" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/projects') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <FolderKanban size={16} className={isLinkActive('/projects') ? 'text-white' : 'text-[#E68A00] dark:text-[#F1C21B]'} />
            <span>Projects</span>
          </a>
          <a href="/repository" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/repository') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <Library size={16} className={isLinkActive('/repository') ? 'text-white' : 'text-[#8A3FFC]'} />
            <span>Test Repository</span>
          </a>
          <a href="/runs" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/runs') || currentPath.startsWith('/runs/') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <PlayCircle size={16} className={isLinkActive('/runs') || currentPath.startsWith('/runs/') ? 'text-white' : 'text-[#24A148]'} />
            <span>Test Runs</span>
          </a>
          <a href="/settings" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/settings') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <Settings size={16} className={isLinkActive('/settings') ? 'text-white' : 'text-[#757575] dark:text-[#A8A8A8]'} />
            <span>Settings</span>
          </a>
        </nav>
      </div>

      <div className="p-3 mb-2 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <nav className="space-y-1">
          <a href="/about" className={`flex items-center space-x-3 px-3 py-2 rounded-[4px] font-sans text-xs font-bold transition-colors ${isLinkActive('/about') ? 'bg-[#0F62FE] text-white shadow-sm' : 'text-[#757575] dark:text-[#8D8D8D] hover:bg-[#E8E8E8] dark:hover:bg-[#1C1C21] hover:text-[#161616] dark:hover:text-white'}`}>
            <HelpCircle size={14} className={isLinkActive('/about') ? 'text-white' : 'text-[#008599]'} />
            <span>About</span>
          </a>
        </nav>
      </div>
    </aside>
  );
};
