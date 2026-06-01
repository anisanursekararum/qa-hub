import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { PerformanceTable } from '../components/dashboard/PerformanceTable';
import { AiInsightsCard } from '../components/dashboard/AiInsightsCard';
import { Activity, Zap, Bug, CheckSquare } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/dashboard">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">
            Welcome {user.name.split(' ')[0]}!
          </h1>
          <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
            Here is a quick overview of your workspace performance today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
           <StatCard 
             title="Active Runs" 
             value="14" 
             subtitle={<span className="text-[#0F62FE] font-bold">+2 from last hour</span>}
             icon={<Activity size={14} />}
             borderColor="bg-[#0F62FE]"
           />
           <StatCard 
             title="AI Efficiency" 
             value="94.2%" 
             subtitle={<span className="text-[#161616] dark:text-[#E0E0E0] font-semibold">Machine intelligence optimized</span>}
             icon={<Zap size={14} className="text-[#8A3FFC]" />}
           />
           <StatCard 
             title="Open Defects" 
             value="28" 
             subtitle={<span className="text-[#DA1E28] font-bold">! 4 Critical priority</span>}
             icon={<Bug size={14} className="text-[#DA1E28]" />}
           />
           <StatCard 
             title="Test Coverage" 
             value="88%" 
             subtitle={
               <div className="w-full bg-[#E0E0E0] dark:bg-[#393939] h-1.5 mt-2 rounded-full overflow-hidden">
                 <div className="bg-[#0F62FE] h-full" style={{ width: '88%' }}></div>
               </div>
             }
             icon={<CheckSquare size={14} />}
           />
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Left Column */}
          <div className="flex-1 min-w-0 flex flex-col space-y-6">
            {/* My Projects */}
            <section>
              <div className="bg-[#F4F4F4] dark:bg-[#1C1C21] px-4 py-3 flex justify-between items-center rounded-t-[4px] border-b border-[#E0E0E0] dark:border-[#2D2D39]">
                <h2 className="font-mono font-bold text-[11px] text-[#161616] dark:text-white uppercase tracking-wider">My Projects</h2>
                <button className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-[10px] px-3 py-1.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-1">
                  <span>+ New Project</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-t-0 border-[#E0E0E0] dark:border-[#2D2D39] rounded-b-[4px] overflow-hidden bg-white dark:bg-[#121212]">
                <div className="border-b md:border-b-0 md:border-r border-[#E0E0E0] dark:border-[#2D2D39]">
                  <ProjectCard 
                    title="Enterprise API v4"
                    description="Scaling internal endpoints for global transaction reconciliation and audit trails."
                    status="Active"
                    users={4}
                    updatedText="View Details"
                    gradientFrom="from-[#0B1521]"
                    gradientTo="to-[#070C12]"
                  />
                </div>
                <div>
                  <ProjectCard 
                    title="Smart Checkout UI"
                    description="Applying generative testing to edge cases in the mobile payment gateway integration."
                    status="Active"
                    isAiEnabled={true}
                    users={1}
                    updatedText="Optimize Flow"
                    gradientFrom="from-[#1A1025]"
                    gradientTo="to-[#0F0A15]"
                  />
                </div>
              </div>
            </section>

            {/* Test Suite Performance */}
            <section className="pt-2">
              <PerformanceTable />
            </section>
          </div>

          {/* Right Column */}
          <div className="xl:w-[320px] flex-shrink-0 flex flex-col space-y-6">
            <section className="bg-[#F7F7F7] dark:bg-[#161616] rounded-[4px] overflow-hidden">
              <div className="bg-[#E8E8E8] dark:bg-[#2D2D39] px-4 py-3 border-b border-[#E0E0E0] dark:border-[#393939]">
                <h2 className="font-mono font-bold text-[11px] text-[#161616] dark:text-white uppercase tracking-wider">Latest Activity</h2>
              </div>
              <ActivityFeed />
            </section>
            
            <section>
              <AiInsightsCard />
            </section>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
