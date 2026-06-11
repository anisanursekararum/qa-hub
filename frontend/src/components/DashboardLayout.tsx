import React from 'react';
import { Sidebar } from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string };
  onLogout: () => void;
  currentPath?: string;
  hideProjectSwitcher?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user, onLogout, currentPath = '/dashboard' }) => {

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#121212] transition-colors duration-200">
      <Sidebar currentPath={currentPath} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="relative z-50 h-16 flex-shrink-0 flex items-center justify-between px-8 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] transition-colors duration-200">
          {/* Left side - Kept empty for spacing if needed, or can put breadcrumbs here later */}
          <div className="flex items-center relative">
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
