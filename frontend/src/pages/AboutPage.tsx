import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';

const AboutPage = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/about" hideProjectSwitcher={true}>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto min-h-full pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8">
            <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">About QA-Hub</h1>
            <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
              Test Management & Orchestration Platform.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] p-6 shadow-sm">
            <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-4">Meet the Creator</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-[#0F62FE] text-white flex items-center justify-center font-sans font-black text-4xl flex-shrink-0">
                QC
              </div>
              <div>
                <h3 className="font-sans font-black text-2xl text-[#161616] dark:text-white mb-2">QA-Hub Creator</h3>
                <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] leading-relaxed mb-4">
                  Welcome to QA-Hub! I built this platform to simplify and empower quality assurance teams across the globe. By centralizing test management, execution, and AI-driven insights, QA-Hub aims to boost productivity and ensure high-quality software releases.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">GitHub</a>
                  <a href="#" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">LinkedIn</a>
                  <a href="#" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">Portfolio</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D]">
              QA-Hub Core v1.0.0 &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutPage;
