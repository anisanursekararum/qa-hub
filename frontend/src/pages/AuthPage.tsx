import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'register'>(
    location.pathname === '/signup' ? 'register' : 'login'
  );
  const [authenticatedUser, setAuthenticatedUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setView(location.pathname === '/signup' ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setAuthenticatedUser(JSON.parse(storedUser));
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleAuthSuccess = (userData: any) => {
    // 1. Set component state
    setAuthenticatedUser({ name: userData.name, email: userData.email });
    
    // 2. Store session securely
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify({ name: userData.name, email: userData.email }));
    
    // 3. Redirect to dashboard
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear state
    setAuthenticatedUser(null);
    // Clear session
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#161616] text-[#161616] dark:text-[#E0E0E0] flex flex-col transition-colors duration-200">
      {/* Persistent Elegant Header */}
      <Navbar currentPath={location.pathname} user={authenticatedUser} onLogout={handleLogout} />

      {/* Main Authentication Grid Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden flex flex-col md:flex-row transition-colors duration-200">
          
          {/* Left Side: Tech Banner (Split-screen marketing & orchestration system panel) */}
          <div className="relative w-full md:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-[#161616] via-[#1C1C21] to-[#111116] flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-[#E0E0E0] dark:border-[#2D2D39]">
            
            {/* Background Grid & Luminescence Aura */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute -left-1/4 -bottom-1/4 w-96 h-96 bg-[#0F62FE] rounded-full filter blur-[120px] opacity-10"></div>
            <div className="absolute right-0 top-0 w-80 h-80 bg-[#8A3FFC] rounded-full filter blur-[100px] opacity-15"></div>

            {/* Top Brand Marker */}
            <div className="relative z-10">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[9px] font-bold text-[#8A3FFC] tracking-[0.2em] uppercase px-2 py-0.5 border border-[#8A3FFC] rounded-[2px] bg-[#8A3FFC]/10">
                  AI ASSISTED
                </span>
              </div>
              <h1 className="font-sans font-black text-2xl lg:text-3xl text-white tracking-tight mt-4 leading-tight">
                Orchestrate Quality <br />
                <span className="text-[#0F62FE]">With Absolute Control.</span>
              </h1>
              <p className="font-sans text-xs text-[#A8A8A8] mt-3 max-w-xs leading-relaxed">
                Connect manual QA work with isolated Bitbucket test pipelines and autonomous AI script self-healing.
              </p>
            </div>

            {/* Tech Telemetry Visualization Component */}
            <div className="relative z-10 my-8 p-4 border border-[#2D2D39] rounded-[4px] bg-[#161616]/80 backdrop-blur-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#2D2D39] mb-3">
                <span className="font-mono text-[10px] text-[#A8A8A8] flex items-center">
                  <span className="inline-block w-1.5 h-1.5 bg-[#8A3FFC] rounded-full mr-2 animate-ping"></span>
                  SYSTEM_PIPELINE_TELEMETRY
                </span>
                <span className="font-mono text-[9px] text-[#0F62FE]">v1.0.4</span>
              </div>
              
              {/* Telemetry items simulation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-[#E0E0E0]">Bitbucket Pipeline Status</span>
                  <span className="text-[#198038] bg-[#198038]/10 px-1.5 py-0.5 rounded-[2px]">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-[#E0E0E0]">Active Automation Lockout</span>
                  <span className="text-[#F1C21B] bg-[#F1C21B]/10 px-1.5 py-0.5 rounded-[2px]">MUTEX_READY</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-[#E0E0E0]">AI Self-Healing Engine</span>
                  <span className="text-[#8A3FFC] bg-[#8A3FFC]/10 px-1.5 py-0.5 rounded-[2px]">STANDBY</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Panel */}
            <div className="relative z-10">
              <p className="font-mono text-[9px] text-[#757575] uppercase tracking-wider">
                Platform Security Architecture Compliant &bull; ISO-27001 Secure
              </p>
            </div>
            
          </div>

          {/* Right Side: Render interactive forms based on selected view */}
          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-[#1C1C21] transition-colors duration-200">
            <div className="transition-all duration-300">
              {view === 'login' ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setView('register')}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setView('login')}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default AuthPage;
