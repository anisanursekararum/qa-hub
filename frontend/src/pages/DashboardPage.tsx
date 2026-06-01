import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { PerformanceTable } from '../components/dashboard/PerformanceTable';
import { AiInsightsCard } from '../components/dashboard/AiInsightsCard';
import { Activity, Zap, Bug, CheckSquare } from 'lucide-react';
import { dashboardApi, DashboardSummary } from '../api/dashboard';

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchSummary();
    }
  }, [navigate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            value={loading ? '-' : summary?.stats.activeRuns.toString() || '0'}
            subtitle={<span className="text-[#0F62FE] font-bold">Currently executing</span>}
            icon={<Activity size={14} />}
            borderColor="bg-[#0F62FE]"
          />
          <StatCard
            title="AI Efficiency"
            value="--"
            subtitle={<span className="text-[#161616] dark:text-[#E0E0E0] font-semibold">Coming Soon</span>}
            icon={<Zap size={14} className="text-[#8A3FFC]" />}
          />
          <StatCard
            title="Failed Tests"
            value={loading ? '-' : summary?.stats.openDefects.toString() || '0'}
            subtitle={<span className="text-[#DA1E28] font-bold">Requires attention</span>}
            icon={<Bug size={14} className="text-[#DA1E28]" />}
          />
          <StatCard
            title="Test Coverage"
            value={loading ? '-' : `${summary?.stats.testCoverage || 0}%`}
            subtitle={
              <div className="w-full bg-[#E0E0E0] dark:bg-[#393939] h-1.5 mt-2 rounded-full overflow-hidden">
                <div className="bg-[#0F62FE] h-full" style={{ width: `${summary?.stats.testCoverage || 0}%` }}></div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-t-0 border-[#E0E0E0] dark:border-[#2D2D39] rounded-b-[4px] overflow-hidden bg-white dark:bg-[#121212]">
                {loading ? (
                  <div className="p-4 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D]">Loading projects...</div>
                ) : (
                  summary?.projects.map((project, idx) => (
                    <div key={project.id} className="border-b md:border-b-0 md:border-r border-[#E0E0E0] dark:border-[#2D2D39]">
                      <ProjectCard
                        title={project.name}
                        description={project.description}
                        status="Active"
                        users={project.membersCount}
                        updatedText={`${project.runsCount} test runs`}
                        gradientFrom={idx % 2 === 0 ? "from-[#0B1521]" : "from-[#1A1025]"}
                        gradientTo={idx % 2 === 0 ? "to-[#070C12]" : "to-[#0F0A15]"}
                      />
                    </div>
                  ))
                )}
                {summary?.projects.length === 0 && (
                   <div className="p-4 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D]">No projects found.</div>
                )}
              </div>
            </section>

            {/* Test Suite Performance */}
            <section className="pt-2">
              <PerformanceTable performance={summary?.performance || []} />
            </section>
          </div>

          {/* Right Column */}
          <div className="xl:w-[320px] flex-shrink-0 flex flex-col space-y-6">
            <section className="bg-[#F7F7F7] dark:bg-[#161616] rounded-[4px] overflow-hidden">
              <div className="bg-[#E8E8E8] dark:bg-[#2D2D39] px-4 py-3 border-b border-[#E0E0E0] dark:border-[#393939]">
                <h2 className="font-mono font-bold text-[11px] text-[#161616] dark:text-white uppercase tracking-wider">Latest Activity</h2>
              </div>
              <ActivityFeed activities={summary?.activities || []} />
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
