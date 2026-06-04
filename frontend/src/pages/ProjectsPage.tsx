import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { JoinProjectCard } from '../components/projects/JoinProjectCard';
import { ProjectAdminPanel } from '../components/projects/ProjectAdminPanel';
import { MemberDirectory } from '../components/projects/MemberDirectory';
import { Users, ArrowLeft, Plus, X, Search, EyeOff, Eye } from 'lucide-react';
import { useProject, Project } from '../context/ProjectContext';
import { createProject, getProjectMembers, updateProjectStatus } from '../api/projects';

export const ProjectsPage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { availableProjects, refreshProjects } = useProject();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const filteredProjects = availableProjects.filter(p => {
    const matchesStatus = p.status === filterStatus;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state?.projectId && availableProjects.length > 0) {
      const proj = availableProjects.find(p => p.id === location.state.projectId);
      if (proj) setSelectedProject(proj);
    }
  }, [location.state, availableProjects]);

  useEffect(() => {
    if (selectedProject) {
      setIsLoadingMembers(true);
      getProjectMembers(selectedProject.id)
        .then(setMembers)
        .catch(console.error)
        .finally(() => setIsLoadingMembers(false));
    }
  }, [selectedProject]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    try {
      await createProject(newProjectName, newProjectDesc);
      await refreshProjects();
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/projects">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto min-h-full">
        
        {/* Create Project Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616]">
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Create New Workspace</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Workspace Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      placeholder="e.g., Mobile App v2"
                      className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Description (Optional)</label>
                    <textarea 
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                      placeholder="Briefly describe this project's goals..."
                      rows={3}
                      className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] transition-colors resize-none"
                    />
                  </div>
                </div>
                
                <div className="p-5 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 font-sans font-semibold text-sm text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!selectedProject ? (
          <>
            <div className="mb-8 border-b border-[#E0E0E0] dark:border-[#2D2D39] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">
                  Workspaces
                </h1>
                <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
                  Create new project or join a new one using a secure code. You can manage your project in here too.
                </p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2 flex-shrink-0"
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F4F4F4] dark:bg-[#1C1C21] p-3 rounded-[4px] border border-[#E0E0E0] dark:border-[#2D2D39]">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575] dark:text-[#8D8D8D]" />
                <input 
                  type="text" 
                  placeholder="Search workspaces..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] pl-9 pr-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] transition-colors"
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setFilterStatus('ACTIVE')}
                  className={`px-4 py-1.5 font-sans text-sm font-semibold rounded-[4px] transition-colors ${filterStatus === 'ACTIVE' ? 'bg-[#0F62FE] text-white' : 'bg-transparent text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E0E0E0] dark:hover:bg-[#393939]'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFilterStatus('ARCHIVED')}
                  className={`px-4 py-1.5 font-sans text-sm font-semibold rounded-[4px] transition-colors ${filterStatus === 'ARCHIVED' ? 'bg-[#0F62FE] text-white' : 'bg-transparent text-[#525252] dark:text-[#A8A8A8] hover:bg-[#E0E0E0] dark:hover:bg-[#393939]'}`}
                >
                  Archived
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Project Grid */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProjects.slice(0, visibleCount).map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-6 cursor-pointer hover:border-[#0F62FE] dark:hover:border-[#0F62FE] transition-colors group relative overflow-hidden shadow-sm flex flex-col h-full"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#0F62FE] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex justify-between items-start mb-4">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-[2px] ${proj.role === 'ADMIN_PROJECT' ? 'bg-[#8A3FFC]/10 text-[#8A3FFC]' : 'bg-[#E0E0E0] dark:bg-[#393939] text-[#525252] dark:text-[#A8A8A8]'
                          }`}>
                          {proj.role}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1.5 text-[#757575] dark:text-[#8D8D8D]">
                            <Users size={14} />
                            <span className="font-mono text-[10px]">{proj.teamSize}</span>
                          </div>
                          {proj.role === 'ADMIN_PROJECT' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const newStatus = proj.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                                try {
                                  await updateProjectStatus(proj.id, newStatus);
                                  refreshProjects();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="text-[#525252] dark:text-[#8D8D8D] hover:text-[#0F62FE] dark:hover:text-[#4589FF] transition-colors"
                              title={proj.status === 'ACTIVE' ? "Hide/Archive Workspace" : "Unhide/Activate Workspace"}
                            >
                              {proj.status === 'ACTIVE' ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white mb-2 group-hover:text-[#0F62FE] dark:group-hover:text-[#4589FF] transition-colors">{proj.name}</h3>
                      <p className="font-sans text-xs text-[#525252] dark:text-[#A8A8A8] flex-1 leading-relaxed">{proj.description}</p>
                    </div>
                  ))}
                </div>
                {filteredProjects.length > visibleCount && (
                  <div className="mt-6 flex justify-center">
                    <button 
                      onClick={() => setVisibleCount(c => c + 4)}
                      className="font-sans font-semibold text-sm text-[#0F62FE] hover:text-[#0353E9] transition-colors px-6 py-2 border border-[#0F62FE] rounded-[4px]"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>

              {/* Join Section */}
              <div className="w-full lg:w-[320px] flex-shrink-0 sticky top-8">
                <JoinProjectCard />
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-8">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center space-x-2 text-[#525252] dark:text-[#A8A8A8] hover:text-[#0F62FE] dark:hover:text-[#4589FF] font-sans text-xs font-semibold mb-6 transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Workspace</span>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">
                    {selectedProject.name}
                  </h1>
                  <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] max-w-2xl">
                    {selectedProject.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-block font-mono text-[11px] font-bold px-3 py-1 rounded-[2px] ${selectedProject.role === 'ADMIN_PROJECT' ? 'bg-[#8A3FFC]/10 text-[#8A3FFC] border border-[#8A3FFC]/30' : 'bg-[#E0E0E0] dark:bg-[#393939] text-[#525252] dark:text-[#A8A8A8] border border-[#CCCCCC] dark:border-[#525252]'
                    }`}>
                    {selectedProject.role}
                  </span>
                </div>
              </div>
            </div>

            {isLoadingMembers ? (
              <div className="text-sm text-[#525252] dark:text-[#A8A8A8]">Loading members...</div>
            ) : selectedProject.role === 'ADMIN_PROJECT' ? (
              <ProjectAdminPanel 
                members={members} 
                projectId={selectedProject.id} 
                onMembersChange={() => {
                  setIsLoadingMembers(true);
                  import('../api/projects').then(({ getProjectMembers }) => {
                    getProjectMembers(selectedProject.id)
                      .then(setMembers)
                      .catch(console.error)
                      .finally(() => setIsLoadingMembers(false));
                  });
                }}
              />
            ) : (
              <MemberDirectory members={members} />
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
