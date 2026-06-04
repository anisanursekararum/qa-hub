import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Plus, Copy, FileText, CheckCircle2, CircleDashed, Clock, ChevronRight, Archive, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useProject } from '../context/ProjectContext';
import { testRunsApi, TestRun } from '../api/testruns';

const TestRunsPage = () => {
  const { activeProject } = useProject();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRunName, setNewRunName] = useState('');
  const [newRunEnv, setNewRunEnv] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'IN_PROGRESS' | 'AUTOMATION_RUNNING' | 'DONE' | 'ARCHIVED'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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
    navigate('/login');
  };

  useEffect(() => {
    if (activeProject) {
      loadRuns();
    }
  }, [activeProject]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await testRunsApi.findAll(activeProject!.id);
      setRuns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newRunName.trim()) return;
    try {
      await testRunsApi.create(activeProject.id, newRunName, newRunEnv);
      setIsCreateModalOpen(false);
      setNewRunName('');
      setNewRunEnv('');
      loadRuns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (runId: string) => {
    if (!activeProject) return;
    try {
      await testRunsApi.duplicate(activeProject.id, runId);
      loadRuns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (runId: string) => {
    if (!activeProject) return;
    try {
      await testRunsApi.updateStatus(runId, 'ARCHIVED');
      loadRuns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (runId: string) => {
    if (!activeProject) return;
    if (!window.confirm('Are you sure you want to permanently delete this test run?')) return;
    try {
      await testRunsApi.deleteRun(runId);
      loadRuns();
    } catch (err) {
      console.error(err);
    }
  };

  const StatusPill = ({ status }: { status: TestRun['status'] }) => {
    switch (status) {
      case 'DRAFT': return <span className="flex items-center space-x-1 font-mono text-xs text-[#F1C21B] bg-[#F1C21B]/10 px-2 py-0.5 rounded-[2px] font-bold"><Clock size={12} /><span>DRAFT</span></span>;
      case 'IN_PROGRESS': return <span className="flex items-center space-x-1 font-mono text-xs text-[#0F62FE] bg-[#0F62FE]/10 px-2 py-0.5 rounded-[2px] font-bold"><CircleDashed size={12} /><span>IN PROGRESS</span></span>;
      case 'AUTOMATION_RUNNING': return <span className="flex items-center space-x-1 font-mono text-xs text-[#8A3FFC] bg-[#8A3FFC]/10 px-2 py-0.5 rounded-[2px] font-bold animate-pulse"><PlayCircle size={12} /><span>AUTOMATION RUNNING</span></span>;
      case 'DONE': return <span className="flex items-center space-x-1 font-mono text-xs text-[#24A148] bg-[#24A148]/10 px-2 py-0.5 rounded-[2px] font-bold"><CheckCircle2 size={12} /><span>DONE</span></span>;
      case 'ARCHIVED': return <span className="flex items-center space-x-1 font-mono text-xs text-[#757575] bg-[#E0E0E0]/50 px-2 py-0.5 rounded-[2px] font-bold"><Archive size={12} /><span>ARCHIVED</span></span>;
    }
  };

  // Helper to calculate progress for list view
  const calculateProgress = (run: TestRun) => {
    const total = run._count?.items || 0;
    if (total === 0) return 0;
    const completed = (run.items || []).filter(i => i.executionStatus !== 'TO_DO').length;
    return Math.round((completed / total) * 100);
  };

  if (!user) return null;

  if (!activeProject) {
    return (
      <DashboardLayout user={user} onLogout={handleLogout} currentPath="/runs">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-full flex items-center justify-center mb-4">
            <PlayCircle size={32} className="text-[#0F62FE]" />
          </div>
          <h2 className="font-sans font-bold text-2xl text-[#161616] dark:text-white mb-2">No Workspace Selected</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/runs">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto min-h-full pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8 border-b border-[#E0E0E0] dark:border-[#2D2D39] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">
                Test Runs
              </h1>
              <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
                Manage test cycles for <span className="font-bold">{activeProject.name}</span>.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2 w-fit"
            >
              <Plus size={16} />
              <span>New Test Run</span>
            </button>
          </div>


          <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] p-3 rounded-[4px] mb-4 shadow-sm sticky top-0 z-10">
            {/* Search Bar */}
            <div className="flex-1 flex items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-1.5 w-full md:w-auto">
              <FileText size={16} className="text-[#757575] dark:text-[#8D8D8D] mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by Run Name or Environment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-[#161616] dark:text-white w-full placeholder-[#A8A8A8]"
              />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-2 py-1 font-sans text-sm font-bold text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                >
                  <option value="ALL">ALL</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="AUTOMATION_RUNNING">AUTOMATION RUNNING</option>
                  <option value="DONE">DONE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#121212] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#161616] dark:text-white flex items-center">
                <PlayCircle size={16} className="mr-2 text-[#0F62FE]" /> Active Cycles
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F4F4] dark:bg-[#121212] border-b border-[#E0E0E0] dark:border-[#393939]">
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Run ID / Name</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Environment</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Initiated By</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider text-center">Progress</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-3 font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0] dark:divide-[#393939]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#525252] dark:text-[#A8A8A8] font-mono text-sm">
                        Loading runs...
                      </td>
                    </tr>
                  ) : runs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#525252] dark:text-[#A8A8A8] font-mono text-sm">
                        No test runs found. Create one to begin.
                      </td>
                    </tr>
                  ) : (() => {
                    const filteredRuns = runs.filter(run => {
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        if (!run.name.toLowerCase().includes(q) && !(run.environment?.toLowerCase().includes(q))) {
                          return false;
                        }
                      }
                      if (statusFilter === 'ALL' && run.status === 'ARCHIVED') {
                        return false;
                      }
                      if (statusFilter !== 'ALL' && run.status !== statusFilter) {
                        return false;
                      }
                      return true;
                    });
                    const paginatedRuns = filteredRuns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                    // Group by Status
                    const groupedRuns = paginatedRuns.reduce((acc, run) => {
                      if (!acc[run.status]) acc[run.status] = [];
                      acc[run.status].push(run);
                      return acc;
                    }, {} as Record<string, TestRun[]>);

                    if (Object.keys(groupedRuns).length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-[#525252] dark:text-[#A8A8A8] font-mono text-sm">
                            No runs match your filters.
                          </td>
                        </tr>
                      );
                    }

                    return Object.entries(groupedRuns).map(([statusName, statusRuns]) => (
                      <React.Fragment key={statusName}>
                        <tr className="bg-[#EAEAEA] dark:bg-[#2D2D39]">
                          <td colSpan={8} className="px-4 py-2">
                            <h3 className="font-mono font-bold text-sm uppercase text-[#161616] dark:text-white">Status Group: {statusName.replace('_', ' ')}</h3>
                          </td>
                        </tr>
                        {statusRuns.map(run => {
                          const progress = calculateProgress(run);
                          return (
                            <tr key={run.id} className="hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39]/50 transition-colors group">
                              <td className="px-4 py-4 cursor-pointer" onClick={() => navigate(`/runs/${run.id}`)}>
                                <div className="flex items-center">
                                  <FileText size={16} className="text-[#0F62FE] mr-3" />
                                  <div>
                                    <div className="font-mono text-sm font-bold text-[#161616] dark:text-white">{run.name.split(' - ')[0]}</div>
                                    <div className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">{run.name.split(' - ').slice(1).join(' - ') || 'Unnamed Run'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <StatusPill status={run.status} />
                              </td>
                              <td className="px-4 py-4 font-mono text-sm text-[#161616] dark:text-[#E0E0E0]">
                                {run.environment || '-'}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <span className="font-sans font-semibold text-sm text-[#161616] dark:text-white">{run.initiatedBy?.name || 'System'}</span>
                                  <span className="font-mono text-sm text-[#757575] dark:text-[#8D8D8D]">{run.initiatedBy?.email || '-'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center w-48 cursor-pointer" onClick={() => navigate(`/runs/${run.id}`)}>
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-full bg-[#E0E0E0] dark:bg-[#393939] h-2 rounded-full overflow-hidden">
                                    <div className="bg-[#0F62FE] h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                  </div>
                                  <span className="font-mono text-xs text-[#525252] dark:text-[#A8A8A8] w-8">{progress}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-mono text-sm text-[#525252] dark:text-[#A8A8A8]">
                                {new Date(run.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 font-mono text-sm text-[#525252] dark:text-[#A8A8A8]">
                                {run.updatedAt ? new Date(run.updatedAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-4 text-right space-x-2">
                                {run.status !== 'ARCHIVED' && (
                                  <button onClick={() => handleArchive(run.id)} className="text-[#525252] hover:text-[#0F62FE] dark:text-[#A8A8A8]" title="Archive Run">
                                    <Archive size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(run.id)} className="text-[#525252] hover:text-[#DA1E28] dark:text-[#A8A8A8]" title="Delete Run">
                                  <Trash2 size={16} />
                                </button>
                                <button onClick={() => handleDuplicate(run.id)} className="text-[#525252] hover:text-[#161616] dark:text-[#A8A8A8] dark:hover:text-white" title="Duplicate Run">
                                  <Copy size={16} />
                                </button>
                                <button onClick={() => navigate(`/runs/${run.id}`)} className="text-[#0F62FE] hover:text-[#0353E9]" title="View Details">
                                  <ChevronRight size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {(() => {
                const filteredRuns = runs.filter(run => {
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    if (!run.name.toLowerCase().includes(q) && !(run.environment?.toLowerCase().includes(q))) {
                      return false;
                    }
                  }
                  if (statusFilter === 'ALL' && run.status === 'ARCHIVED') {
                    return false;
                  }
                  if (statusFilter !== 'ALL' && run.status !== statusFilter) {
                    return false;
                  }
                  return true;
                });
                const totalPages = Math.ceil(filteredRuns.length / itemsPerPage);
                if (totalPages > 1) {
                  return (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#161616]">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-[#525252] dark:text-[#8D8D8D] font-mono">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-md my-8 animate-in zoom-in-95">
              <div className="p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616]">
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Create Test Run</h3>
              </div>
              <form onSubmit={handleCreateRun}>
                <div className="p-6">
                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Run Objective / Name</label>
                  <input type="text" required autoFocus value={newRunName} onChange={e => setNewRunName(e.target.value)} placeholder="e.g. Release 1.4 Regression" className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]" />
                  <p className="mt-2 mb-4 text-xs font-mono text-[#8D8D8D]">TR-ID will be auto-generated.</p>

                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Environment (Optional)</label>
                  <input type="text" value={newRunEnv} onChange={e => setNewRunEnv(e.target.value)} placeholder="e.g. Staging, Production" className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]" />
                </div>
                <div className="p-4 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-sans font-semibold text-sm text-[#161616] dark:text-white hover:bg-[#E0E0E0] dark:hover:bg-[#393939] rounded-[4px] transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm">Create Run</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TestRunsPage;
