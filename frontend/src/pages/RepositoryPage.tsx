import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useProject } from '../context/ProjectContext';
import { 
  FilePlus, Upload, Sparkles, Filter, CheckCircle2, Clock, 
  AlertCircle, PlayCircle, X, FileText, UploadCloud, Edit3, Trash2, Search
} from 'lucide-react';

interface ProjectModule {
  id: string;
  name: string;
  code: string;
}

interface TestCase {
  id: string;
  publicId: string;
  title: string;
  moduleId: string;
  prerequisite: string;
  steps: string;
  expectedResult: string;
  status: 'DRAFT' | 'READY' | 'DEPRECATED';
  automation: 'MANUAL' | 'AUTOMATED' | 'FLAKY';
  author: string;
}

interface FilterCondition {
  id: string;
  property: 'Status' | 'Module' | 'Automation';
  operator: '==' | '!=';
  value: string;
}

interface ImportHistory {
  fileName: string;
  date: string;
  status: 'SUCCESS' | 'FAILED';
}

const mockModules: ProjectModule[] = [
  { id: 'm1', name: 'Authentication', code: 'AUTH' },
  { id: 'm2', name: 'Payments', code: 'PAY' },
  { id: 'm3', name: 'UI Components', code: 'UI' },
];

const mockCases: TestCase[] = [
  { id: 'tc1', publicId: 'TC-AUTH-001', title: 'Verify successful OAuth login with Google', moduleId: 'm1', prerequisite: 'Valid Google Account', steps: '1. Click Google Login', expectedResult: 'User is redirected to Dashboard', status: 'READY', automation: 'AUTOMATED', author: 'Sarah J.' },
  { id: 'tc2', publicId: 'TC-AUTH-002', title: 'Handle invalid refresh token gracefully', moduleId: 'm1', prerequisite: 'Expired token', steps: '1. Send request with expired token', expectedResult: 'Returns 401 Unauthorized', status: 'DRAFT', automation: 'MANUAL', author: 'Marcus C.' },
  { id: 'tc3', publicId: 'TC-PAY-001', title: 'Process Stripe webhook for subscription renewal', moduleId: 'm2', prerequisite: 'Active Stripe webhook endpoint', steps: '1. Send mock webhook payload', expectedResult: 'Subscription extended by 1 month', status: 'READY', automation: 'AUTOMATED', author: 'Sarah J.' },
  { id: 'tc4', publicId: 'TC-PAY-002', title: 'Decline expired credit card on checkout', moduleId: 'm2', prerequisite: 'User with items in cart', steps: '1. Enter expired card details\n2. Submit', expectedResult: 'Error message: Card Expired', status: 'DRAFT', automation: 'MANUAL', author: 'You' },
  { id: 'tc5', publicId: 'TC-UI-001', title: 'Display correct localized currency symbol', moduleId: 'm3', prerequisite: 'Locale set to EUR', steps: '1. Load pricing page', expectedResult: 'Prices shown with € symbol', status: 'DEPRECATED', automation: 'FLAKY', author: 'Elena R.' },
];

const mockImports: ImportHistory[] = [
  { fileName: 'legacy_cases_q3.csv', date: '2026-05-30 14:22:00', status: 'SUCCESS' },
  { fileName: 'payment_tests_v2.csv', date: '2026-05-28 09:15:00', status: 'FAILED' },
];

export const RepositoryPage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const { activeProject } = useProject();
  const navigate = useNavigate();

  const [modules, setModules] = useState<ProjectModule[]>(mockModules);
  const [cases, setCases] = useState<TestCase[]>(mockCases);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter State
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [filterProperty, setFilterProperty] = useState<'Status' | 'Module' | 'Automation'>('Status');
  const [filterOperator, setFilterOperator] = useState<'==' | '!='>('==');
  const [filterValue, setFilterValue] = useState<string>('DRAFT');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isNewModuleMode, setIsNewModuleMode] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const submitActionRef = React.useRef<'UPDATE' | 'READY'>('UPDATE');
  const [formData, setFormData] = useState({
    title: '',
    moduleId: '',
    newModuleName: '',
    newModuleCode: '',
    prerequisite: '',
    steps: '',
    expectedResult: '',
    hasAutomation: false
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ title: '', moduleId: '', newModuleName: '', newModuleCode: '', prerequisite: '', steps: '', expectedResult: '', hasAutomation: false });
    setIsNewModuleMode(false);
    setIsCaseModalOpen(true);
  };

  const openReviewModal = (tc: TestCase) => {
    setEditingId(tc.id);
    setFormData({
      title: tc.title,
      moduleId: tc.moduleId,
      newModuleName: '',
      newModuleCode: '',
      prerequisite: tc.prerequisite,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      hasAutomation: tc.automation !== 'MANUAL'
    });
    setIsNewModuleMode(false);
    setIsCaseModalOpen(true);
  };

  const handleCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    let finalModuleId = formData.moduleId;
    
    // Handle Custom Module Creation
    if (isNewModuleMode && formData.newModuleName && formData.newModuleCode) {
      const newModule: ProjectModule = {
        id: `m_${Math.random().toString(36).substring(2,9)}`,
        name: formData.newModuleName,
        code: formData.newModuleCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5)
      };
      setModules([...modules, newModule]);
      finalModuleId = newModule.id;
    }

    if (!finalModuleId) return;

    const mod = modules.find(m => m.id === finalModuleId) || { code: formData.newModuleCode.toUpperCase() };

    if (editingId) {
      const targetStatus = submitActionRef.current === 'READY' ? 'READY' : cases.find(c => c.id === editingId)?.status || 'DRAFT';
      setCases(prev => prev.map(c => c.id === editingId ? {
        ...c,
        title: formData.title,
        moduleId: finalModuleId,
        prerequisite: formData.prerequisite,
        steps: formData.steps,
        expectedResult: formData.expectedResult,
        automation: formData.hasAutomation ? 'AUTOMATED' : 'MANUAL',
        status: targetStatus as any
      } : c));
    } else {
      const newTc: TestCase = {
        id: `tc_${Math.random()}`,
        publicId: `TC-${mod.code}-${Math.floor(Math.random() * 900) + 100}`,
        title: formData.title,
        moduleId: finalModuleId,
        prerequisite: formData.prerequisite,
        steps: formData.steps,
        expectedResult: formData.expectedResult,
        status: 'DRAFT',
        automation: formData.hasAutomation ? 'AUTOMATED' : 'MANUAL',
        author: user?.name || 'You'
      };
      setCases([newTc, ...cases]);
    }
    setIsCaseModalOpen(false);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map(c => c.id)));
    }
  };

  const handleBulkStatusUpdate = (status: TestCase['status']) => {
    setCases(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status } : c));
    setSelectedIds(new Set());
  };

  const handleAddFilter = () => {
    if (!filterValue) return;
    // prevent duplicates
    if (filters.some(f => f.property === filterProperty && f.operator === filterOperator && f.value === filterValue)) return;
    
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      property: filterProperty,
      operator: filterOperator,
      value: filterValue
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  if (!user) return null;

  // Filtering Logic
  const filteredCases = cases.filter(tc => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!tc.title.toLowerCase().includes(q) && !tc.publicId.toLowerCase().includes(q)) {
        return false;
      }
    }

    for (const f of filters) {
      let match = false;
      if (f.property === 'Status') match = tc.status === f.value;
      else if (f.property === 'Module') match = tc.moduleId === f.value;
      else if (f.property === 'Automation') match = tc.automation === f.value;

      const conditionMet = f.operator === '==' ? match : !match;
      if (!conditionMet) return false;
    }

    return true;
  });

  // Group filtered cases
  const groupedCases = filteredCases.reduce((acc, tc) => {
    const modName = modules.find(m => m.id === tc.moduleId)?.name || 'Unknown';
    if (!acc[modName]) acc[modName] = [];
    acc[modName].push(tc);
    return acc;
  }, {} as Record<string, TestCase[]>);

  const getFilterOptions = () => {
    if (filterProperty === 'Status') return [{v: 'DRAFT', l: 'DRAFT'}, {v: 'READY', l: 'READY'}, {v: 'DEPRECATED', l: 'DEPRECATED'}];
    if (filterProperty === 'Module') return modules.map(m => ({ v: m.id, l: m.name }));
    if (filterProperty === 'Automation') return [{v: 'MANUAL', l: 'MANUAL'}, {v: 'AUTOMATED', l: 'AUTOMATED'}, {v: 'FLAKY', l: 'FLAKY'}];
    return [];
  };

  const StatusPill = ({ status }: { status: TestCase['status'] }) => {
    switch (status) {
      case 'READY': return <span className="flex items-center space-x-1 font-mono text-[10px] text-[#24A148] bg-[#24A148]/10 px-2 py-0.5 rounded-[2px] font-bold"><CheckCircle2 size={12}/><span>READY</span></span>;
      case 'DRAFT': return <span className="flex items-center space-x-1 font-mono text-[10px] text-[#F1C21B] bg-[#F1C21B]/10 px-2 py-0.5 rounded-[2px] font-bold"><Clock size={12}/><span>DRAFT</span></span>;
      case 'DEPRECATED': return <span className="flex items-center space-x-1 font-mono text-[10px] text-[#8D8D8D] bg-[#393939] px-2 py-0.5 rounded-[2px] font-bold"><AlertCircle size={12}/><span>DEPRECATED</span></span>;
    }
  };

  const AutoPill = ({ auto }: { auto: TestCase['automation'] }) => {
    switch (auto) {
      case 'AUTOMATED': return <span className="font-mono text-[10px] text-[#0F62FE] border border-[#0F62FE]/30 px-2 py-0.5 rounded-[2px] font-bold">AUTO</span>;
      case 'MANUAL': return <span className="font-mono text-[10px] text-[#8D8D8D] border border-[#525252] px-2 py-0.5 rounded-[2px] font-bold">MANUAL</span>;
      case 'FLAKY': return <span className="font-mono text-[10px] text-[#DA1E28] border border-[#DA1E28]/30 px-2 py-0.5 rounded-[2px] font-bold">FLAKY</span>;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/repository">
      
      {/* Dynamic Case Form Modal (Create / Review) */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-3xl my-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                {editingId ? <Edit3 size={18} className="text-[#0F62FE]" /> : <FilePlus size={18} className="text-[#0F62FE]" />}
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">
                  {editingId ? 'Review & Edit Case' : 'Manual Case Creation'}
                </h3>
              </div>
              <button onClick={() => setIsCaseModalOpen(false)} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCaseSubmit}>
              <div className="p-6 space-y-6">
                
                {/* Header Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Project</label>
                    <input type="text" readOnly value={activeProject?.name || ''} className="w-full bg-[#E0E0E0] dark:bg-[#2D2D39] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#525252] dark:text-[#A8A8A8] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Test Case ID</label>
                    <input type="text" readOnly value={editingId ? cases.find(c=>c.id===editingId)?.publicId : 'Auto-generated by system'} className="w-full bg-[#E0E0E0] dark:bg-[#2D2D39] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-xs text-[#525252] dark:text-[#A8A8A8] cursor-not-allowed" />
                  </div>
                </div>

                {/* Module Section */}
                <div className="bg-[#F7F7F7] dark:bg-[#121212] p-4 rounded-[4px] border border-[#E0E0E0] dark:border-[#393939]">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-sans text-xs font-bold text-[#161616] dark:text-white uppercase tracking-wider">Module Assignment</label>
                    {!isNewModuleMode ? (
                      <button type="button" onClick={() => setIsNewModuleMode(true)} className="text-[#0F62FE] text-xs font-semibold hover:underline">Customize / New Module</button>
                    ) : (
                      <button type="button" onClick={() => setIsNewModuleMode(false)} className="text-[#DA1E28] text-xs font-semibold hover:underline">Cancel Custom Module</button>
                    )}
                  </div>
                  
                  {!isNewModuleMode ? (
                    <select required value={formData.moduleId} onChange={e => setFormData({...formData, moduleId: e.target.value})} className="w-full bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]">
                      <option value="" disabled>Select an existing module...</option>
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input type="text" required placeholder="Module Name (e.g. Shopping Cart)" value={formData.newModuleName} onChange={e => setFormData({...formData, newModuleName: e.target.value})} className="w-full bg-white dark:bg-[#1C1C21] border border-[#0F62FE] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none" />
                      </div>
                      <div>
                        <input type="text" required placeholder="Module Code (e.g. CART)" value={formData.newModuleCode} onChange={e => setFormData({...formData, newModuleCode: e.target.value})} className="w-full bg-white dark:bg-[#1C1C21] border border-[#0F62FE] rounded-[4px] px-3 py-2 font-mono text-sm text-[#161616] dark:text-white focus:outline-none uppercase" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Fields */}
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Case Title *</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Clear, concise description of the test" className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]" />
                </div>
                
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Prerequisite</label>
                  <textarea value={formData.prerequisite} onChange={e => setFormData({...formData, prerequisite: e.target.value})} placeholder="Any required state before executing (e.g., User must be logged in)" rows={2} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Test Steps</label>
                    <textarea value={formData.steps} onChange={e => setFormData({...formData, steps: e.target.value})} placeholder="1. Navigate to...\n2. Click on..." rows={4} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-xs text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none" />
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#161616] dark:text-white mb-1.5">Expected Result</label>
                    <textarea value={formData.expectedResult} onChange={e => setFormData({...formData, expectedResult: e.target.value})} placeholder="System should display success modal..." rows={4} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none" />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input type="checkbox" id="hasAutomation" checked={formData.hasAutomation} onChange={e => setFormData({...formData, hasAutomation: e.target.checked})} className="w-4 h-4 text-[#0F62FE] bg-[#F4F4F4] dark:bg-[#121212] border-gray-300 rounded" />
                  <label htmlFor="hasAutomation" className="font-sans text-sm text-[#161616] dark:text-white font-semibold">Automated script available</label>
                </div>
              </div>
              
              <div className="p-5 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3 sticky bottom-0">
                <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 font-sans font-semibold text-sm text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white transition-colors">Cancel</button>
                {editingId ? (
                  <>
                    <button type="submit" onClick={() => submitActionRef.current = 'UPDATE'} className="px-4 py-2 font-sans font-semibold text-sm text-[#0F62FE] border border-[#0F62FE] hover:bg-[#0F62FE]/10 rounded-[4px] transition-colors shadow-sm">
                      Update
                    </button>
                    <button type="submit" onClick={() => submitActionRef.current = 'READY'} className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#24A148] hover:bg-[#198038] rounded-[4px] transition-colors shadow-sm">
                      Set Ready
                    </button>
                  </>
                ) : (
                  <button type="submit" className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm">
                    Create Case
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616]">
              <div className="flex items-center space-x-2">
                <Upload size={18} className="text-[#161616] dark:text-white" />
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Bulk CSV Import</h3>
              </div>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-[#CCCCCC] dark:border-[#393939] rounded-[4px] p-10 flex flex-col items-center justify-center text-center mb-8 bg-[#F7F7F7] dark:bg-[#121212] hover:border-[#0F62FE] cursor-pointer">
                <UploadCloud size={32} className="text-[#525252] dark:text-[#A8A8A8] mb-4" />
                <h4 className="font-sans font-bold text-[#161616] dark:text-white mb-1">Click to upload CSV</h4>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="p-6 sm:p-8 max-w-7xl mx-auto min-h-full pb-32">
        {!activeProject ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-[#0F62FE]" />
            </div>
            <h2 className="font-sans font-bold text-2xl text-[#161616] dark:text-white mb-2">No Workspace Selected</h2>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-8">
              <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">Test Repository</h1>
              <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
                Manage cases for <span className="font-bold">{activeProject.name}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button onClick={openCreateModal} className="flex items-start p-5 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] hover:border-[#0F62FE] transition-colors group">
                <div className="w-10 h-10 bg-[#F4F4F4] dark:bg-[#121212] flex items-center justify-center rounded-[4px] mr-4"><FilePlus size={20} className="text-[#0F62FE]"/></div>
                <div className="text-left"><h3 className="font-bold text-sm mb-1 text-black dark:text-white">Manual Create</h3><p className="text-xs text-[#757575] dark:text-[#8D8D8D]">Write from scratch.</p></div>
              </button>
              <button onClick={() => setIsBulkImportOpen(true)} className="flex items-start p-5 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] hover:border-[#0F62FE] transition-colors group">
                <div className="w-10 h-10 bg-[#F4F4F4] dark:bg-[#121212] flex items-center justify-center rounded-[4px] mr-4"><Upload size={20} className="text-black dark:text-white"/></div>
                <div className="text-left"><h3 className="font-bold text-sm mb-1 text-black dark:text-white">Bulk CSV Import</h3><p className="text-xs text-[#757575] dark:text-[#8D8D8D]">Import legacy cases.</p></div>
              </button>
              <button className="flex items-start p-5 bg-[#1C1C21] dark:bg-[#121212] border-2 border-dashed border-[#8A3FFC]/50 rounded-[4px] group">
                <div className="w-10 h-10 bg-[#8A3FFC]/10 flex items-center justify-center rounded-[4px] mr-4"><Sparkles size={20} className="text-[#8A3FFC]"/></div>
                <div className="text-left"><h3 className="font-bold text-sm text-white mb-1">AI PRD Ingestion</h3></div>
              </button>
            </div>

            {/* Flexible Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] p-3 rounded-[4px] mb-4 shadow-sm sticky top-0 z-10">
              
              {/* Search Bar */}
              <div className="flex-1 flex items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-1.5 w-full md:w-auto">
                <Search size={16} className="text-[#757575] dark:text-[#8D8D8D] mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search by ID or Title..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-[#161616] dark:text-white w-full placeholder-[#A8A8A8]"
                />
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-6 bg-[#E0E0E0] dark:bg-[#393939]"></div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter size={16} className="text-[#757575] dark:text-[#8D8D8D] ml-2" />
                <select value={filterProperty} onChange={e => {
                  const prop = e.target.value as any;
                  setFilterProperty(prop);
                  if (prop === 'Status') setFilterValue('DRAFT');
                  else if (prop === 'Module') setFilterValue(modules[0]?.id || '');
                  else if (prop === 'Automation') setFilterValue('MANUAL');
                }} className="bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616]">
                  <option value="Status">Status</option>
                  <option value="Module">Module</option>
                  <option value="Automation">Automation</option>
                </select>
                <select value={filterOperator} onChange={e => setFilterOperator(e.target.value as any)} className="bg-transparent text-sm text-[#0F62FE] font-mono focus:outline-none">
                  <option value="==">IS</option>
                  <option value="!=">IS NOT</option>
                </select>
                <select value={filterValue} onChange={e => setFilterValue(e.target.value)} className="bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white flex-1 min-w-[120px]">
                  {getFilterOptions().map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                </select>
                <button onClick={handleAddFilter} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white px-3 py-1 rounded-[2px] text-sm font-semibold transition-colors">
                  Add
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 animate-in slide-in-from-top-2">
                {filters.map(f => {
                  const valLabel = f.property === 'Module' ? (modules.find(m => m.id === f.value)?.name || f.value) : f.value;
                  return (
                    <div key={f.id} className="flex items-center space-x-1.5 bg-[#E8E8E8] dark:bg-[#2D2D39] text-[#161616] dark:text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      <span className="text-[#525252] dark:text-[#A8A8A8] font-normal">{f.property}</span>
                      <span className="text-[#0F62FE] font-mono mx-0.5">{f.operator}</span>
                      <span>{valLabel}</span>
                      <button onClick={() => removeFilter(f.id)} className="ml-1.5 text-[#757575] hover:text-[#DA1E28] transition-colors rounded-full p-0.5 hover:bg-[#DA1E28]/10">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List with Checkboxes */}
            <div className="space-y-6">
              {Object.entries(groupedCases).map(([moduleName, moduleCases]) => (
                <div key={moduleName} className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] shadow-sm">
                  <div className="bg-[#F7F7F7] dark:bg-[#161616] px-5 py-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input type="checkbox" onChange={toggleAll} checked={selectedIds.size > 0 && Array.from(selectedIds).some(id => moduleCases.find(mc => mc.id === id))} className="w-4 h-4 rounded text-[#0F62FE] border-gray-300 focus:ring-[#0F62FE] bg-[#F4F4F4] dark:bg-[#1C1C21]" />
                      <h3 className="font-mono font-bold text-[11px] uppercase text-[#161616] dark:text-white">Module: {moduleName}</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-[#E0E0E0] dark:divide-[#2D2D39]">
                    {moduleCases.map(tc => (
                      <div key={tc.id} className="p-4 hover:bg-[#F4F4F4] dark:hover:bg-[#161616]/50 flex flex-col sm:flex-row justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <input type="checkbox" checked={selectedIds.has(tc.id)} onChange={() => toggleSelection(tc.id)} className="w-4 h-4 rounded text-[#0F62FE] border-gray-300 focus:ring-[#0F62FE] bg-[#F4F4F4] dark:bg-[#1C1C21]" />
                          <div className="font-mono text-xs font-bold text-[#0F62FE] w-24">{tc.publicId}</div>
                          <div>
                            <h4 className="font-sans text-sm font-semibold text-[#161616] dark:text-white">{tc.title}</h4>
                            <div className="flex space-x-2 mt-1"><StatusPill status={tc.status} /><AutoPill auto={tc.automation} /></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          {tc.status === 'DRAFT' && (
                            <button onClick={() => openReviewModal(tc)} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white text-xs px-3 py-1.5 rounded-[4px]">Review & Submit</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#161616] border border-[#393939] shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6 z-50 animate-in slide-in-from-bottom-10">
                <span className="font-sans font-bold text-sm text-white">{selectedIds.size} selected</span>
                <div className="h-4 w-px bg-[#393939]"></div>
                <div className="flex items-center space-x-3">
                  <select onChange={e => handleBulkStatusUpdate(e.target.value as any)} className="bg-[#1C1C21] text-xs font-bold text-white px-3 py-1.5 rounded-[4px] border border-[#393939] focus:outline-none">
                    <option value="">Update Status...</option>
                    <option value="READY">Mark READY</option>
                    <option value="DRAFT">Mark DRAFT</option>
                    <option value="DEPRECATED">Mark DEPRECATED</option>
                  </select>
                  <button onClick={() => {
                     setCases(cases.filter(c => !selectedIds.has(c.id)));
                     setSelectedIds(new Set());
                  }} className="text-[#DA1E28] hover:text-[#BA1B23] p-1.5 rounded-full hover:bg-[#DA1E28]/10"><Trash2 size={16} /></button>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RepositoryPage;
