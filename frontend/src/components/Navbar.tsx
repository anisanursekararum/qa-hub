import React from 'react';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  currentPath?: string;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath = '/', user = null, onLogout }) => {
  const isLinkActive = (path: string) => currentPath === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-[#161616] border-b border-[#E0E0E0] dark:border-[#2D2D39] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">

          {/* Left Side: Brand Logo */}
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-2.5 focus:outline-none">
              {/* QA-Hub Logo Symbol */}
              <img src="/qa-hub-logo.png" alt="QA-Hub Logo" className="w-7 h-7 rounded-[4px] object-contain bg-white" />
              <span className="font-sans font-bold text-base tracking-wide">
                <span className="text-[#0F62FE]">QA</span><span className="text-[#8A3FFC]">Hub</span>
              </span>
            </a>

            {/* Navigation links for Authenticated Users */}
            {user && (
              <div className="hidden md:flex space-x-1">
                <a
                  href="/projects"
                  className={`px-3 py-1.5 font-sans font-medium text-xs rounded-[4px] transition-colors duration-150 ${isLinkActive('/projects')
                      ? 'bg-[#F4F4F4] dark:bg-[#1C1C21] text-[#0F62FE] dark:text-white font-semibold'
                      : 'text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21]'
                    }`}
                >
                  Projects
                </a>
                <a
                  href="/repository"
                  className={`px-3 py-1.5 font-sans font-medium text-xs rounded-[4px] transition-colors duration-150 ${isLinkActive('/repository')
                      ? 'bg-[#F4F4F4] dark:bg-[#1C1C21] text-[#0F62FE] dark:text-white font-semibold'
                      : 'text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21]'
                    }`}
                >
                  Test Repository
                </a>
                <a
                  href="/runs"
                  className={`px-3 py-1.5 font-sans font-medium text-xs rounded-[4px] transition-colors duration-150 ${isLinkActive('/runs')
                      ? 'bg-[#F4F4F4] dark:bg-[#1C1C21] text-[#0F62FE] dark:text-white font-semibold'
                      : 'text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21]'
                    }`}
                >
                  Test Runs
                </a>
              </div>
            )}
          </div>

          {/* Right Side: Theme Toggle & User Info */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-3.5 border-l border-[#E0E0E0] dark:border-[#2D2D39] pl-4">
                <div className="flex flex-col text-right">
                  <span className="font-sans font-semibold text-xs text-[#161616] dark:text-white leading-tight">
                    {user.name}
                  </span>
                  <span className="font-sans text-[10px] text-[#757575] dark:text-[#8D8D8D] leading-none">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 font-sans font-medium text-xs text-[#DA1E28] hover:bg-[#FFF1F1] dark:hover:bg-[#2D161A] border border-transparent rounded-[4px] transition-colors duration-150 focus:outline-none"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <a
                  href="/login"
                  className="px-3.5 py-1.5 font-sans font-semibold text-xs border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] text-[#161616] dark:text-[#E0E0E0] hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21] transition-colors duration-150"
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  className="px-3.5 py-1.5 font-sans font-semibold text-xs bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] text-white transition-colors duration-150 focus:ring-1 focus:ring-offset-1 focus:ring-[#0F62FE]"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
export default Navbar;
